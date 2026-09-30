import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import meats from '@/data/meats.json';

const METHODS = [
  'smoker', 'oven', 'rotisserie', 'dehydrator', 'kamado',
  'charcoal_kettle', 'wood_fire', 'slow_cooker', 'pressure_cooker',
] as const;
const method = z.enum(METHODS);
const perMethod = <T extends z.ZodTypeAny>(v: T) => z.record(method, v);

const cutSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    methods: z.array(method).min(1),
    cutCategory: z.enum(['bbq', 'fish', 'veggie', 'jerky']).optional(),
    timeMode: perMethod(z.enum(['per_kg', 'flat'])),
    hoursPerKg: perMethod(z.number().positive()),
    flatCookHours: perMethod(z.number().positive()),
    applianceTempC: perMethod(z.number().positive()),
    internalTempC: perMethod(z.number().nullable()),
    restMinutes: z.number().min(0),
    hasStall: perMethod(z.boolean()),
    stallTempC: z.number().nullable(),
    wrapTempC: perMethod(z.number().nullable()),
    safeMinTempC: z.number().min(0),
    donenessCue: z.string().optional(),
    preheatTempC: z.number().optional(),
    rubs: z.array(z.string()),
    woods: z.array(z.string()),
    tips: z.array(z.string()),
  })
  .superRefine((cut, ctx) => {
    for (const m of cut.methods) {
      if (cut.applianceTempC[m] === undefined) {
        ctx.addIssue({ code: 'custom', message: `${cut.id}: method ${m} has no applianceTempC` });
      }
      const mode = cut.timeMode[m];
      if (mode === undefined) {
        ctx.addIssue({ code: 'custom', message: `${cut.id}: method ${m} has no timeMode` });
      } else if (mode === 'per_kg' && cut.hoursPerKg[m] === undefined) {
        ctx.addIssue({ code: 'custom', message: `${cut.id}: ${m} is per_kg but has no hoursPerKg` });
      } else if (mode === 'flat' && cut.flatCookHours[m] === undefined) {
        ctx.addIssue({ code: 'custom', message: `${cut.id}: ${m} is flat but has no flatCookHours` });
      }
    }
  });

const schema = z.array(
  z.object({ id: z.string().min(1), name: z.string().min(1), cuts: z.array(cutSchema).min(1) })
);

describe('data/meats.json schema', () => {
  it('parses against the schema', () => {
    const res = schema.safeParse(meats);
    if (!res.success) {
      throw new Error(res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
    }
  });

  it('has unique cut ids', () => {
    const ids = (meats as { cuts: { id: string }[] }[]).flatMap((c) => c.cuts.map((x) => x.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
