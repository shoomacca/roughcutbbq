'use client';

import { useState } from 'react';

interface Props {
  cutName: string;
  initialWeight: number | null;
  onSubmit: (weightKg: number) => void;
  onBack: () => void;
}

export default function WeightStep({ cutName, initialWeight, onSubmit, onBack }: Props) {
  const [value, setValue] = useState<string>(initialWeight?.toString() ?? '');

  const weightKg = parseFloat(value);
  const isValid = !isNaN(weightKg) && weightKg >= 0.1 && weightKg <= 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSubmit(weightKg);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          onClick={onBack}
          className="text-brand-muted hover:text-brand-text text-sm mb-3 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold text-brand-text">How much are you cooking?</h2>
        <p className="text-brand-muted text-sm mt-1">{cutName} — enter the total weight</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="weight" className="text-sm font-medium text-brand-muted">
            Weight (kg)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="weight"
              type="number"
              min="0.1"
              max="30"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full bg-brand-surface border-2 border-brand-muted/20 rounded-xl px-4 py-4 text-brand-text text-2xl font-bold focus:outline-none focus:border-brand-primary transition-colors"
              autoFocus
            />
            <span className="text-brand-muted font-semibold text-xl">kg</span>
          </div>
          {value && !isValid && (
            <p className="text-red-400 text-xs">Enter a weight between 0.1 and 30 kg</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white font-semibold px-6 py-4 rounded-xl text-base"
        >
          Calculate My Cook Plan →
        </button>
      </form>
    </div>
  );
}
