'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadResult, loadInput, clearResult, addToHistory } from '@/lib/resultStorage';
import { calculateCook } from '@/lib/calculator';
import { buildShareUrl, copyToClipboard } from '@/lib/shareUtils';
import { nowTimeString, addHours } from '@/lib/timeUtils';
import { formatCookTime } from '@/lib/calculator';
import { canIncrement, markIncremented } from '@/lib/tallyUtils';
import ResultsCard from '@/components/calculator/ResultsCard';
import MilestoneCard from '@/components/calculator/MilestoneCard';
import SaveModal from '@/components/results/SaveModal';
import TallyCounter from '@/components/TallyCounter';
import UploadFlow from '@/components/gallery/UploadFlow';
import GearRecommendation from '@/components/GearRecommendation';
import EmailCapture from '@/components/results/EmailCapture';
import { cookPlanJsonLd } from '@/lib/jsonld';
import { trackEvent } from '@/lib/posthog';
import type { CalculatorInput, CalculatorResult } from '@/types/calculator';

function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [input, setInput] = useState<CalculatorInput | null>(null);
  const [startTime, setStartTime] = useState<string>(() =>
    typeof window !== 'undefined' ? nowTimeString() : ''
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSaveCook = async () => {
    if (saveStatus !== 'idle' || !result) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/auth/me');
      const { user } = await res.json();
      
      if (user) {
        const saveRes = await fetch('/api/saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
        if (saveRes.ok) {
          addToHistory(result);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          addToHistory(result);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
          setShowSaveModal(true);
        }
      } else {
        addToHistory(result);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setShowSaveModal(true);
      }
    } catch {
      addToHistory(result);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      setShowSaveModal(true);
    }
  };

  // Increment tally once per 60-second session window
  useEffect(() => {
    if (canIncrement()) {
      fetch('/api/tally', { method: 'POST' }).catch(() => {});
      markIncremented();
    }
  }, []);

  // Track calculator_completed once when result loads
  useEffect(() => {
    if (result) {
      trackEvent('calculator_completed', {
        cut: result.cutName,
        method: result.method,
        weight_kg: result.weightKg,
      });
    }
  }, [result]);

  useEffect(() => {
    // Try sessionStorage first
    const stored = loadResult();
    const storedInput = loadInput();
    if (stored && storedInput) {
      Promise.resolve().then(() => {
        setResult(stored);
        setInput(storedInput);
      });
      return;
    }

    // Fall back to URL params (shared link)
    const method = searchParams.get('method');
    const cat = searchParams.get('cat');
    const cut = searchParams.get('cut');
    const kg = searchParams.get('kg');

    if (method && cat && cut && kg) {
      try {
        const urlInput: CalculatorInput = {
          method: method as CalculatorInput['method'],
          categoryId: cat,
          cutId: cut,
          weightKg: parseFloat(kg),
        };
        const urlResult = calculateCook(urlInput);
        Promise.resolve().then(() => {
          setResult(urlResult);
          setInput(urlInput);
        });
      } catch {
        router.replace('/calculator');
      }
      return;
    }

    // Nothing found — send back to calculator
    router.replace('/calculator');
  }, [router, searchParams]);

  if (!result || !input) return null;

  const totalHours = result.cookTimeHours + result.restMinutes / 60;

  const handleShare = async () => {
    const url = buildShareUrl(input);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jsonLd = cookPlanJsonLd(
    result.cutName,
    result.method,
    Math.round(result.cookTimeHours * 60),
    result.applianceTempC,
    result.internalTempC
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-8">

        {/* Print-only title — hidden on screen */}
        <div className="print-title hidden">
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '4pt' }}>
            BBQ Cook Plan — {result.cutName}
          </h1>
          <p style={{ fontSize: '10pt', color: '#555' }}>
            Method: {result.method} · Weight: {result.weightKg} kg · Cook time: ~{formatCookTime(result.cookTimeHours)}
          </p>
          <hr style={{ margin: '8pt 0' }} />
        </div>

        <ResultsCard result={result} />

        {/* Tally social proof */}
        <p className="no-print text-center text-xs text-brand-muted">
          🔥 Join <TallyCounter suffix="" inline /> pitmasters who&apos;ve planned their cook
        </p>

        {/* Action buttons */}
        <div className="no-print flex flex-wrap gap-3">
          <button
            onClick={handleSaveCook}
            disabled={saveStatus === 'saving'}
            className="flex-1 min-w-[140px] bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 transition-colors text-white font-bold px-6 py-3 rounded-xl text-sm cursor-pointer"
          >
            {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✅ Saved!' : '🔖 Save this cook'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-brand-muted/30 rounded-xl text-sm text-brand-muted hover:bg-brand-surface hover:text-brand-text transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-brand-muted/30 rounded-xl text-sm text-brand-muted hover:bg-brand-surface hover:text-brand-text transition-colors"
          >
            {copied ? '✅ Copied!' : '🔗 Share'}
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-brand-muted/30 rounded-xl text-sm text-brand-muted hover:bg-brand-surface hover:text-brand-text transition-colors"
          >
            📸 Share your cook
          </button>
        </div>

        {/* Start time picker */}
        <div className="no-print bg-brand-dark rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wide mb-0.5">Start time</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-transparent text-brand-text text-xl font-bold focus:outline-none cursor-pointer"
            />
          </div>
          {startTime && (
            <div className="sm:text-right">
              <p className="text-xs text-brand-muted font-medium uppercase tracking-wide mb-0.5">Ready at</p>
              <p className="text-brand-primary text-xl font-bold">
                {addHours(startTime, totalHours)}
              </p>
            </div>
          )}
        </div>

        {/* Cook Timeline */}
        <div>
          <h3 className="text-base font-bold text-brand-text mb-4">Cook Timeline</h3>
          {result.milestones.length > 0 ? (
            <div className="flex flex-col">
              {result.milestones.map((milestone, i) => (
                <div key={i} className="milestone-card">
                  <MilestoneCard
                    milestone={milestone}
                    index={i}
                    timeOffsetLabel={`~${formatCookTime(milestone.timeOffsetHours)} in`}
                    clockTime={startTime ? addHours(startTime, milestone.timeOffsetHours) : undefined}
                    isLast={i === result.milestones.length - 1}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-muted text-sm bg-brand-dark rounded-xl px-4 py-4 text-center">
              No specific milestones for this cook — watch the clock and probe for doneness.
            </p>
          )}
        </div>

        {/* Contextual gear recommendation */}
        <div className="no-print">
          <GearRecommendation method={result.method} limit={1} title="Recommended Gear" />
        </div>

        {/* Email capture */}
        <div className="no-print">
          <EmailCapture
            cut={result.cutName}
            method={result.method}
            weight_kg={result.weightKg}
            cook_time_minutes={Math.round(result.cookTimeHours * 60)}
            appliance_temp_c={result.applianceTempC}
            internal_temp_c={result.internalTempC ?? 0}
          />
        </div>

        {/* Start new cook */}
        <button
          onClick={() => { clearResult(); router.push('/calculator'); }}
          className="no-print w-full border-2 border-brand-muted/20 hover:border-brand-muted/50 text-brand-muted hover:text-brand-text transition-colors font-semibold px-6 py-3 rounded-xl text-sm"
        >
          ← Start new cook
        </button>

      </div>

      <SaveModal open={showSaveModal} onClose={() => setShowSaveModal(false)} />
      {showUpload && (
        <UploadFlow
          cutName={result.cutName}
          method={result.method}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsInner />
    </Suspense>
  );
}
