import { z } from 'zod';
import meatsData from '@/data/meats.json';
import type { MeatCategory } from '@/types/calculator';

const meats = meatsData as MeatCategory[];

export const MIN_WEIGHT_KG = 0.1;
export const MAX_WEIGHT_KG = 30;

/** The single source of truth for calculator input (engine, /results URL params). */
export const calculatorInputSchema = z
  .object({
    method: z.string().min(1),
    categoryId: z.string().min(1),
    cutId: z.string().min(1),
    weightKg: z
      .number()
      .finite()
      .min(MIN_WEIGHT_KG, `Weight must be at least ${MIN_WEIGHT_KG} kg`)
      .max(MAX_WEIGHT_KG, `Weight must be at most ${MAX_WEIGHT_KG} kg`),
  })
  .superRefine((v, ctx) => {
    const category = meats.find((c) => c.id === v.categoryId);
    if (!category) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: `Category not found: ${v.categoryId}` });
      return;
    }
    const cut = category.cuts.find((c) => c.id === v.cutId);
    if (!cut) {
      ctx.addIssue({ code: 'custom', path: ['cutId'], message: `Cut not found: ${v.cutId}` });
      return;
    }
    if (!(cut.methods as string[]).includes(v.method)) {
      ctx.addIssue({
        code: 'custom',
        path: ['method'],
        message: `Method "${v.method}" not supported for cut "${cut.name}"`,
      });
    }
  });

type Params = { get(name: string): string | null };

/** Parses `/results?method=&cat=&cut=&kg=`. Returns null when any field is missing or invalid. */
export function parseCalculatorParams(params: Params) {
  const method = params.get('method');
  const cat = params.get('cat');
  const cut = params.get('cut');
  const kg = params.get('kg');
  if (!method || !cat || !cut || !kg || kg.trim() === '') return null;
  const parsed = calculatorInputSchema.safeParse({
    method,
    categoryId: cat,
    cutId: cut,
    weightKg: Number(kg),
  });
  return parsed.success ? (parsed.data as import('@/types/calculator').CalculatorInput) : null;
}

/** True when the URL carries any calculator param (so it must win over sessionStorage). */
export function hasCalculatorParams(params: Params): boolean {
  return ['method', 'cat', 'cut', 'kg'].some((k) => params.get(k) !== null);
}
