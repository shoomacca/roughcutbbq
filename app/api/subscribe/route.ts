import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import * as React from 'react';
import { getSupabase } from '@/lib/supabase';
import CookPlanEmail from '@/emails/CookPlanEmail';

const bodySchema = z.object({
  email: z.string().email(),
  cut: z.string().optional(),
  method: z.string().optional(),
  weight_kg: z.number().optional(),
  cook_time_minutes: z.number().int().optional(),
  appliance_temp_c: z.number().int().optional(),
  internal_temp_c: z.number().int().optional(),
});

interface GearRow {
  name: string;
  slug: string;
  recommended_for: string | null;
}

async function getContextualGear(method?: string): Promise<{ name: string; slug: string } | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('gear')
      .select('name, slug, recommended_for')
      .order('sort_order', { ascending: true });
    const gear = (data ?? []) as GearRow[];
    if (!gear.length) return null;

    if (method) {
      const methodLower = method.toLowerCase();
      const matched = gear.find((g) => {
        const rf = (g.recommended_for ?? '').toLowerCase();
        return rf.includes(methodLower) || rf.includes('all');
      });
      if (matched) return { name: matched.name, slug: matched.slug };
    }

    const thermometer = gear.find((g) => (g.recommended_for ?? '').toLowerCase().includes('thermometer'));
    return thermometer ?? { name: gear[0].name, slug: gear[0].slug };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const { email, cut, method, weight_kg, cook_time_minutes, appliance_temp_c, internal_temp_c } =
    parsed.data;

  const unsubscribe_token = crypto.randomBytes(32).toString('hex');

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('subscribers').insert({
      email,
      cut: cut ?? null,
      method: method ?? null,
      weight_kg: weight_kg ?? null,
      cook_time_minutes: cook_time_minutes ?? null,
      appliance_temp_c: appliance_temp_c ?? null,
      internal_temp_c: internal_temp_c ?? null,
      unsubscribe_token,
    });
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });
      }
      console.error('Subscribe DB error:', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('Subscribe DB error:', err);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${unsubscribe_token}`;

  const gear = await getContextualGear(method);
  const gearUrl = gear ? `${siteUrl}/go/${gear.slug}` : undefined;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = await render(
      React.createElement(CookPlanEmail, {
        email,
        cut: cut ?? '',
        method: method ?? '',
        weight_kg: weight_kg ?? 0,
        cook_time_minutes: cook_time_minutes ?? 0,
        appliance_temp_c: appliance_temp_c ?? 0,
        internal_temp_c: internal_temp_c ?? 0,
        unsubscribe_url: unsubscribeUrl,
        gear_name: gear?.name,
        gear_url: gearUrl,
      })
    );

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Rough Cut BBQ <hello@roughcut.com.au>',
      to: email,
      subject: `Your Rough Cut BBQ Cook Plan${cut && method ? ` — ${cut} on ${method}` : ''}`,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err);
    // Best-effort — subscriber saved, don't fail the request
  }

  return NextResponse.json({ success: true });
}
