import type { CalculatorInput, CalculatorResult } from '@/types/calculator';

const KEY = 'bbq_result';
const INPUT_KEY = 'bbq_input';
const HISTORY_KEY = 'bbq_history';

export interface SavedCook extends CalculatorResult {
  saveId: string;
  savedAt: string;
  rating?: number;
  notes?: string;
}

export function getHistory(): SavedCook[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCook[];
  } catch {
    return [];
  }
}

function setHistory(history: SavedCook[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function addToHistory(result: CalculatorResult): SavedCook {
  const entry: SavedCook = {
    ...result,
    saveId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
  };
  const history = getHistory();
  setHistory([entry, ...history]);
  return entry;
}

export function deleteFromHistory(saveId: string): void {
  setHistory(getHistory().filter((c) => c.saveId !== saveId));
}

export function updateHistory(saveId: string, updates: Partial<Pick<SavedCook, 'rating' | 'notes'>>): void {
  setHistory(getHistory().map((c) => c.saveId === saveId ? { ...c, ...updates } : c));
}

export function saveResult(result: CalculatorResult): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadResult(): CalculatorResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalculatorResult;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(INPUT_KEY);
}

export function saveInput(input: CalculatorInput): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(INPUT_KEY, JSON.stringify(input));
}

export function loadInput(): CalculatorInput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(INPUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalculatorInput;
  } catch {
    return null;
  }
}
