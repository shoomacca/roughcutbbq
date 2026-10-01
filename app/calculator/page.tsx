'use client';

import { useState, Suspense } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { slideStep } from '@/lib/motion';
import { useRouter } from 'next/navigation';
import { useCalculator } from '@/lib/useCalculator';
import { calculateCook, getMeatCategories } from '@/lib/calculator';
import { saveResult, saveInput } from '@/lib/resultStorage';
import MethodStep from '@/components/calculator/MethodStep';
import CategoryStep from '@/components/calculator/CategoryStep';
import CutStep from '@/components/calculator/CutStep';
import WeightStep from '@/components/calculator/WeightStep';
import ProgressBar from '@/components/ProgressBar';

function CalculatorInner() {
  const router = useRouter();
  const [initialCat] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const cat = sessionStorage.getItem('bbq_initial_cat') ?? undefined;
    if (cat) sessionStorage.removeItem('bbq_initial_cat');
    return cat;
  });

  const { state, setCategory, setMethod, setCut, goBack } = useCalculator(initialCat);

  const pre = state.categoryPreSelected;

  // Direction of the last step change (1 forward, -1 back) drives the slide.
  const [dir, setDir] = useState<1 | -1>(1);
  const forward = <T,>(fn: (v: T) => void) => (v: T) => { setDir(1); fn(v); };

  const handleWeightSubmit = (weightKg: number) => {
    if (!state.method || !state.categoryId || !state.cutId) return;
    const input = { method: state.method, categoryId: state.categoryId, cutId: state.cutId, weightKg };
    const result = calculateCook(input);
    saveResult(result);
    saveInput(input);
    router.push('/results');
  };

  const cutName = (() => {
    if (!state.categoryId || !state.cutId) return '';
    const cats = getMeatCategories();
    const cat = cats.find((c) => c.id === state.categoryId);
    return cat?.cuts.find((c) => c.id === state.cutId)?.name ?? '';
  })();

  const handleBack = () => {
    setDir(-1);
    if (pre && state.step === 1) router.push('/');
    else goBack();
  };

  return (
    <div className="flex flex-col flex-1">
      {/* ── Progress bar — constrained, padded ─────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-3">
        <ProgressBar current={pre ? state.step + 1 : state.step} />
      </div>

      {/* ── Step content — vertically centred in remaining page space ──── */}
      {/* Carousel steps: full width so calc(50% - halfCard) = 50% of viewport */}
      {/* Weight step: constrained and centred */}
      <div className="flex-1 flex flex-col justify-center overflow-x-clip">
       <AnimatePresence mode="wait" custom={dir} initial={false}>
        <m.div
          key={state.step}
          custom={dir}
          variants={slideStep}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col flex-1 justify-center"
        >

        {/* Step 1 (free mode): category carousel — full width */}
        {!pre && state.step === 1 && (
          <CategoryStep
            method={null}
            selected={state.categoryId}
            onSelect={forward(setCategory)}
            onBack={() => router.push('/')}
          />
        )}

        {/* Method carousel — full width */}
        {((pre && state.step === 1) || (!pre && state.step === 2)) && (
          <MethodStep
            selected={state.method}
            categoryId={state.categoryId}
            onSelect={forward(setMethod)}
            onBack={handleBack}
          />
        )}

        {/* Cut carousel — full width */}
        {((pre && state.step === 2) || (!pre && state.step === 3)) && state.method && state.categoryId && (
          <CutStep
            method={state.method}
            categoryId={state.categoryId}
            selected={state.cutId}
            onSelect={forward(setCut)}
            onBack={handleBack}
          />
        )}

        {/* Weight step — constrained */}
        {((pre && state.step === 3) || (!pre && state.step === 4)) && (
          <div className="max-w-2xl mx-auto w-full px-4 pb-8 flex-1 flex flex-col justify-center">
            <WeightStep
              cutName={cutName}
              initialWeight={state.weightKg}
              onSubmit={handleWeightSubmit}
              onBack={handleBack}
            />
          </div>
        )}
        </m.div>
       </AnimatePresence>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense>
      <CalculatorInner />
    </Suspense>
  );
}
