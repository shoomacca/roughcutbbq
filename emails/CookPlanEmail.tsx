import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
  Section,
} from '@react-email/components';
import * as React from 'react';

export interface CookPlanEmailProps {
  email: string;
  cut: string;
  method: string;
  weight_kg: number;
  cook_time_minutes: number;
  appliance_temp_c: number;
  internal_temp_c: number;
  unsubscribe_url: string;
  gear_name?: string;
  gear_url?: string;
}

function formatCookTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const row = (label: string, value: string) => (
  <Section style={{ marginBottom: 8 }}>
    <Text style={{ margin: 0, color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </Text>
    <Text style={{ margin: 0, color: '#ffffff', fontSize: 16, fontWeight: 600 }}>
      {value}
    </Text>
  </Section>
);

export default function CookPlanEmail({
  cut,
  method,
  weight_kg,
  cook_time_minutes,
  appliance_temp_c,
  internal_temp_c,
  unsubscribe_url,
  gear_name,
  gear_url,
}: CookPlanEmailProps) {
  return (
    <Html lang="en">
      <Body style={{ backgroundColor: '#111827', fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <Heading style={{ color: '#f59e0b', fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>
            🔥 Your Rough Cut BBQ Cook Plan
          </Heading>
          <Text style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 32px' }}>
            Everything you need for a perfect cook.
          </Text>

          {/* Cook Summary */}
          <Section style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: '24px 24px 16px', marginBottom: 24 }}>
            {row('Cut', cut)}
            {row('Method', method)}
            {row('Weight', `${weight_kg} kg`)}
            {row('Cook Time', formatCookTime(cook_time_minutes))}
            {row('Appliance Temp', `${appliance_temp_c}°C`)}
            {row('Target Internal Temp', `${internal_temp_c}°C`)}
          </Section>

          {/* Gear Recommendation (conditional) */}
          {gear_name && gear_url && (
            <Section style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
              <Text style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Recommended for this cook
              </Text>
              <Link
                href={gear_url}
                style={{ color: '#f59e0b', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
              >
                {gear_name} →
              </Link>
            </Section>
          )}

          <Hr style={{ borderColor: '#374151', margin: '0 0 24px' }} />

          {/* Footer */}
          <Text style={{ color: '#6b7280', fontSize: 12, margin: '0 0 8px', lineHeight: 1.6 }}>
            You&apos;re receiving this because you asked Rough Cut BBQ to email your cook plan.
          </Text>
          <Link href={unsubscribe_url} style={{ color: '#6b7280', fontSize: 12 }}>
            Unsubscribe
          </Link>

        </Container>
      </Body>
    </Html>
  );
}
