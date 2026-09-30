'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { trackEvent } from '@/lib/posthog';

interface Props {
  cutName?: string;
  method?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function UploadFlow({ cutName, method, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gearUsed, setGearUsed] = useState('');
  const [localCut, setLocalCut] = useState(cutName || '');
  const [localMethod, setLocalMethod] = useState(method || '');
  const [error, setError] = useState('');
  const [postId, setPostId] = useState('');
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File, which: 'before' | 'after') {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Images only (jpeg, png, webp)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max 10MB per image');
      return;
    }
    const url = URL.createObjectURL(file);
    if (which === 'before') {
      setBeforeFile(file);
      setBeforePreview(url);
    } else {
      setAfterFile(file);
      setAfterPreview(url);
    }
  }

  async function submit() {
    if (!beforeFile || !afterFile) return;
    if (!localCut.trim() || !localMethod) {
      setError('Please provide the meat cut and cooking method.');
      return;
    }
    
    setStep(4);
    setError('');
    try {
      const form = new FormData();
      form.append('before', beforeFile);
      form.append('after', afterFile);
      form.append('cut', localCut.trim());
      form.append('method', localMethod);
      if (name.trim()) form.append('name', name.trim());
      if (gearUsed.trim()) form.append('gearUsed', gearUsed.trim());

      const res = await fetch('/api/gallery/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setPostId(data.postId);
      trackEvent('photo_uploaded', { cut: localCut.trim(), method: localMethod });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStep(3);
    }
  }

  const handleFinish = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ background: '#1a2818', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-base">Share Your Cook</p>
            <p className="text-brand-muted text-xs mt-0.5">
              {localCut ? `${localCut} · ` : ''}{localMethod || 'New Post'}
            </p>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 pt-4">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: step >= s ? '#f97316' : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* ── Step 1: Before photo ── */}
          {step === 1 && (
            <>
              <p className="text-white font-semibold text-sm">Step 1 — Before photo</p>
              <p className="text-brand-muted text-xs -mt-2">Raw meat, before it hits the heat</p>
              <input
                ref={beforeRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0], 'before')}
              />
              {beforePreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={beforePreview} alt="Before preview" fill className="object-cover" />
                  <button
                    onClick={() => beforeRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => beforeRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 transition-colors"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-brand-muted text-sm">Tap to add before photo</span>
                  <span className="text-brand-muted/50 text-xs">jpeg · png · webp · max 10MB</span>
                </button>
              )}
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                disabled={!beforeFile}
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 cursor-pointer"
                style={{ background: beforeFile ? '#f97316' : undefined, color: beforeFile ? 'white' : undefined }}
              >
                Next &rarr;
              </button>
            </>
          )}

          {/* ── Step 2: After photo ── */}
          {step === 2 && (
            <>
              <p className="text-white font-semibold text-sm">Step 2 — After photo</p>
              <p className="text-brand-muted text-xs -mt-2">The finished result — show it off!</p>
              <input
                ref={afterRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0], 'after')}
              />
              {afterPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={afterPreview} alt="After preview" fill className="object-cover" />
                  <button
                    onClick={() => afterRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => afterRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 transition-colors"
                >
                  <span className="text-3xl">🍖</span>
                  <span className="text-brand-muted text-sm">Tap to add after photo</span>
                  <span className="text-brand-muted/50 text-xs">jpeg · png · webp · max 10MB</span>
                </button>
              )}
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  className="flex-none px-4 py-3 rounded-xl border border-white/15 text-brand-muted text-sm hover:text-white transition-colors cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  disabled={!afterFile}
                  onClick={() => {
                    setError('');
                    setStep(3);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 cursor-pointer"
                  style={{ background: afterFile ? '#f97316' : undefined, color: afterFile ? 'white' : undefined }}
                >
                  Next &rarr;
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <>
              <p className="text-white font-semibold text-sm">Step 3 — Details</p>

              {!cutName && (
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    Meat Cut *
                  </label>
                  <input
                    type="text"
                    required
                    value={localCut}
                    onChange={(e) => setLocalCut(e.target.value)}
                    placeholder="e.g. Beef Brisket, Pork Ribs"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-muted/50 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}

              {!method && (
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    Cooking Method *
                  </label>
                  <select
                    required
                    value={localMethod}
                    onChange={(e) => setLocalMethod(e.target.value)}
                    className="w-full bg-[#1a2818] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">Select Method...</option>
                    <option value="Smoking">Smoking (Low &amp; Slow)</option>
                    <option value="Pellet Grill">Pellet Grill</option>
                    <option value="Charcoal Kettle">Charcoal Kettle</option>
                    <option value="Kamado">Kamado</option>
                    <option value="Gas Grill">Gas Grill</option>
                    <option value="Oven">Oven</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  Poster Name <span className="text-brand-muted/50 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous (or enter public name)"
                  maxLength={100}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-muted/50 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  Gear Used <span className="text-brand-muted/50 font-normal">(optional)</span>
                </label>
                <textarea
                  value={gearUsed}
                  onChange={(e) => setGearUsed(e.target.value)}
                  placeholder="What grill, smoker, or thermometer did you use?"
                  rows={2}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-muted/50 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError('');
                    setStep(2);
                  }}
                  className="flex-none px-4 py-3 rounded-xl border border-white/15 text-brand-muted text-sm hover:text-white transition-colors cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  onClick={submit}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white cursor-pointer"
                  style={{ background: '#f97316' }}
                >
                  Share Cook &rarr;
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Uploading / Success ── */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {!postId && !error ? (
                <>
                  <div className="w-10 h-10 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
                  <p className="text-white font-semibold">Uploading your cook...</p>
                </>
              ) : (
                <>
                  <span className="text-5xl">🎉</span>
                  <p className="text-white font-bold text-lg">Posted!</p>
                  <p className="text-brand-muted text-sm">Your cook is live in the forum</p>
                  <button
                    onClick={handleFinish}
                    className="mt-2 px-6 py-3 rounded-xl font-bold text-sm text-white cursor-pointer"
                    style={{ background: '#f97316' }}
                  >
                    View in Forum &rarr;
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
