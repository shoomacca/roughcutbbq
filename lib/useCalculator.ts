'use client';

import { useState } from 'react';
import type { CookingMethod, CalculatorResult } from '@/types/calculator';

/**
 * Steps when category is pre-selected from home page:
 *   1 = method, 2 = cut, 3 = weight, 4 = results
 *
 * Steps when no initial category (direct /calculator visit):
 *   1 = category, 2 = method, 3 = cut, 4 = weight, 5 = results
 */
interface CalculatorState {
  step: 1 | 2 | 3 | 4 | 5;
  categoryPreSelected: boolean;
  categoryId: string | null;
  method: CookingMethod | null;
  cutId: string | null;
  weightKg: number | null;
  result: CalculatorResult | null;
}

function makeInitial(initialCategoryId?: string): CalculatorState {
  const pre = !!initialCategoryId;
  return {
    step: pre ? 1 : 1,
    categoryPreSelected: pre,
    categoryId: initialCategoryId ?? null,
    method: null,
    cutId: null,
    weightKg: null,
    result: null,
  };
}

export function useCalculator(initialCategoryId?: string) {
  const [state, setState] = useState<CalculatorState>(() =>
    makeInitial(initialCategoryId)
  );

  const pre = state.categoryPreSelected;

  // In pre-selected mode: 1=method, 2=cut, 3=weight, 4=results
  // In free mode:         1=category, 2=method, 3=cut, 4=weight, 5=results
  const setCategory = (categoryId: string) =>
    setState((s) => ({ ...s, step: 2, categoryId, method: null, cutId: null }));

  const setMethod = (method: CookingMethod) =>
    setState((s) => ({ ...s, step: pre ? 2 : 3, method }));

  const setCut = (cutId: string) =>
    setState((s) => ({ ...s, step: pre ? 3 : 4, cutId }));

  const setWeight = (weightKg: number) =>
    setState((s) => ({ ...s, weightKg }));

  const setResult = (result: CalculatorResult) =>
    setState((s) => ({ ...s, step: pre ? 4 : 5, result }));

  const goBack = () =>
    setState((s) => {
      if (pre) {
        // 1=method → nothing (caller handles router.back)
        // 2=cut → 1=method
        // 3=weight → 2=cut
        if (s.step === 2) return { ...s, step: 1, cutId: null };
        if (s.step === 3) return { ...s, step: 2, cutId: null };
        return s; // step 1 handled by page via router
      } else {
        // 2=method → 1=category
        // 3=cut → 2=method
        // 4=weight → 3=cut
        if (s.step === 2) return { ...s, step: 1, method: null, cutId: null };
        if (s.step === 3) return { ...s, step: 2, cutId: null };
        if (s.step === 4) return { ...s, step: 3 };
        return s;
      }
    });

  const reset = () => setState(makeInitial(initialCategoryId));

  const resultsStep = pre ? 4 : 5;

  return {
    state,
    resultsStep,
    setCategory,
    setMethod,
    setCut,
    setWeight,
    setResult,
    goBack,
    reset,
  };
}
