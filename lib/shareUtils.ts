import type { CalculatorInput } from '@/types/calculator';

export function buildShareUrl(input: CalculatorInput): string {
  const params = new URLSearchParams({
    method: input.method,
    cat: input.categoryId,
    cut: input.cutId,
    kg: String(input.weightKg),
  });
  return `${window.location.origin}/results?${params.toString()}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
