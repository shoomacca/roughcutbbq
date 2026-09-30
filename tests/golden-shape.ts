import { calculateCook, getMeatCategories } from '@/lib/calculator';
import type { CookingMethod } from '@/types/calculator';

export const WEIGHTS_KG = [1, 3, 6] as const;

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export interface GoldenEntry {
  cookTimeHours: number;
  applianceTempC: number;
  internalTempC: number | null;
  restMinutes: number;
  milestones: { label: string; timeOffsetHours: number }[];
}

/** Builds the golden snapshot of today's engine output. Keys: category/cut/method/kg. */
export function buildGoldens(): Record<string, GoldenEntry> {
  const out: Record<string, GoldenEntry> = {};
  for (const cat of getMeatCategories()) {
    for (const cut of cat.cuts) {
      for (const method of cut.methods as CookingMethod[]) {
        for (const kg of WEIGHTS_KG) {
          const r = calculateCook({ method, categoryId: cat.id, cutId: cut.id, weightKg: kg });
          out[`${cat.id}/${cut.id}/${method}/${kg}kg`] = {
            cookTimeHours: r4(r.cookTimeHours),
            applianceTempC: r.applianceTempC,
            internalTempC: r.internalTempC,
            restMinutes: r.restMinutes,
            milestones: r.milestones.map((m) => ({
              label: m.label,
              timeOffsetHours: r4(m.timeOffsetHours),
            })),
          };
        }
      }
    }
  }
  return out;
}
