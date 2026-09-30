import type {
  CalculatorInput,
  CalculatorResult,
  CookMilestone,
  CutCategory,
  MeatCategory,
} from '@/types/calculator';
import meatsData from '@/data/meats.json';

const meats = meatsData as MeatCategory[];

export function formatCookTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h !== 1 ? 's' : ''}`;
  return `${h} hr${h !== 1 ? 's' : ''} ${m} min`;
}

export function getMeatCategories(): MeatCategory[] {
  return meats;
}

export function getMethodsForCategory(categoryId: string): CalculatorInput['method'][] {
  const category = meats.find((c) => c.id === categoryId);
  if (!category) return [];
  const methods = new Set<CalculatorInput['method']>();
  category.cuts.forEach((cut) =>
    (cut.methods as CalculatorInput['method'][]).forEach((m) => methods.add(m))
  );
  return Array.from(methods);
}

export function getCategoriesForMethod(method: CalculatorInput['method']): MeatCategory[] {
  return meats
    .map((cat) => ({
      ...cat,
      cuts: cat.cuts.filter((cut) => cut.methods.includes(method)),
    }))
    .filter((cat) => cat.cuts.length > 0);
}

export function calculateCook(input: CalculatorInput): CalculatorResult {
  const { method, categoryId, cutId, weightKg } = input;

  const category = meats.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Category not found: ${categoryId}`);

  const cut = category.cuts.find((c) => c.id === cutId);
  if (!cut) throw new Error(`Cut not found: ${cutId}`);

  if (!cut.methods.includes(method)) {
    throw new Error(`Method "${method}" not supported for cut "${cut.name}"`);
  }

  const cutCategory: CutCategory = (cut.cutCategory as CutCategory) ?? 'bbq';
  const timeMode = cut.timeMode[method] ?? 'flat';
  const isFlat = timeMode === 'flat';

  const cookTimeHours = isFlat
    ? (cut.flatCookHours[method] ?? 0)
    : (cut.hoursPerKg[method] ?? 0) * weightKg;

  const applianceTempC = cut.applianceTempC[method] ?? 0;
  const internalTempC = cut.internalTempC[method] ?? null;
  const hasStall = cut.hasStall[method] ?? false;
  const wrapTempC = cut.wrapTempC[method] ?? null;

  const milestones: CookMilestone[] = [];

  if (cutCategory === 'jerky') {
    // Jerky: pre-heat step first, then drying
    if (cut.preheatTempC) {
      milestones.push({
        icon: '🌡️',
        label: `Pre-heat to ${cut.preheatTempC}°C internal`,
        description: `Before drying, bring the meat to ${cut.preheatTempC}°C internal — either in an oven/smoker at higher heat for 15–20 min, or start the dehydrator hot enough to hit this temp early. This is a required food-safety step, not optional.`,
        timeOffsetHours: 0,
      });
    }
    milestones.push({
      icon: '⏱️',
      label: 'Dry until leathery',
      description: `Dry at the indicated temperature for the estimated time. Strips are done when they bend and crack slightly but don't snap, feel dry to the touch with no wet spots, and have lost ~60–75% of their raw weight. Time is a guide — use doneness cues.`,
      timeOffsetHours: cookTimeHours * 0.5,
    });
    milestones.push({
      icon: '🧊',
      label: 'Cool and store',
      description: `Let jerky cool completely uncovered before sealing to prevent moisture buildup. Store in the fridge for up to 1–2 weeks, or freeze for longer. Home jerky has no guaranteed water activity — refrigeration is the safe default.`,
      timeOffsetHours: cookTimeHours,
    });
  } else if (cutCategory === 'veggie') {
    // Veggies: texture check milestone
    milestones.push({
      icon: '🥄',
      label: 'Check for doneness',
      description: cut.donenessCue
        ? `${cut.donenessCue}. Check by probing with a skewer or knife — no resistance means it's ready.`
        : 'Test with a skewer or knife — it should pass through with little or no resistance.',
      timeOffsetHours: cookTimeHours,
    });
  } else {
    // BBQ / Fish: standard milestones
    if (hasStall && cut.stallTempC) {
      const stallTime = formatCookTime(cookTimeHours * 0.6);
      milestones.push({
        icon: '🌡️',
        label: `Expect the stall (~${cut.stallTempC}°C internal)`,
        description: `Around ${stallTime} in, the internal temp will plateau at ~${cut.stallTempC}°C for 1–3 hours as moisture evaporates. This is normal — stay patient and keep the temperature steady.`,
        timeOffsetHours: cookTimeHours * 0.6,
      });
    }
    if (wrapTempC !== null) {
      milestones.push({
        icon: '📦',
        label: `Wrap at ${wrapTempC}°C internal`,
        description: `When your probe reads ${wrapTempC}°C, wrap tightly in unwaxed butcher paper (or foil for a faster, steamier finish). This powers through the stall and keeps moisture in.`,
        timeOffsetHours: cookTimeHours * 0.65,
      });
    }
    if (internalTempC !== null) {
      milestones.push({
        icon: '💤',
        label: `Rest for ${cut.restMinutes} minutes`,
        description: `When internal temp hits ${internalTempC}°C, pull it off the heat. Cover loosely with foil and rest for ${cut.restMinutes} minutes — juices redistribute and the temp stabilises for perfect results.`,
        timeOffsetHours: cookTimeHours,
      });
    }
  }

  return {
    cutName: cut.name,
    categoryName: category.name,
    method,
    weightKg,
    cookTimeHours,
    applianceTempC,
    internalTempC,
    safeMinTempC: cut.safeMinTempC,
    restMinutes: cut.restMinutes,
    isFlat,
    cutCategory,
    donenessCue: cut.donenessCue,
    preheatTempC: cut.preheatTempC,
    milestones,
    rubs: cut.rubs || [],
    woods: cut.woods || [],
    tips: cut.tips || [],
  };
}
