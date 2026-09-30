'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistory, deleteFromHistory, saveResult, updateHistory, type SavedCook } from '@/lib/resultStorage';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saves, setSaves] = useState<SavedCook[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        
        if (meData.user) {
          setUser(meData.user);
          const savesRes = await fetch('/api/saves');
          const savesData = await savesRes.json();
          setSaves(savesData.saves || []);
        } else {
          setSaves(getHistory());
        }
      } catch (e) {
        console.error(e);
        setSaves(getHistory());
      } finally {
        setMounted(true);
      }
    });
  }, []);

  const handleLoad = (save: SavedCook) => {
    saveResult(save); // Sets it as active in sessionStorage
    router.push('/results');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (user) {
      try {
        const res = await fetch(`/api/saves?saveId=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSaves((prev) => prev.filter((s) => s.saveId !== id));
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      deleteFromHistory(id);
      setSaves(getHistory());
    }
  };

  const handleRating = async (e: React.MouseEvent, id: string, rating: number) => {
    e.stopPropagation();
    if (user) {
      try {
        const res = await fetch('/api/saves', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saveId: id, rating }),
        });
        if (res.ok) {
          setSaves((prev) => prev.map((s) => (s.saveId === id ? { ...s, rating } : s)));
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      updateHistory(id, { rating });
      setSaves(getHistory());
    }
  };

  const handleNotes = async (id: string, notes: string) => {
    setSaves((prev) => prev.map((s) => (s.saveId === id ? { ...s, notes } : s)));
    if (user) {
      try {
        await fetch('/api/saves', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saveId: id, notes }),
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      updateHistory(id, { notes });
    }
  };

  if (!mounted) return null;

  // Sort saves: Highest rating first, then newest first
  const sortedSaves = [...saves].sort((a, b) => {
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  return (
    <div className="relative w-full flex flex-col items-center pb-20">
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col pt-4">
        <h1 className="text-3xl font-bold text-[#FAF6E9] mb-8" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>My BBQ Logbook</h1>

        {sortedSaves.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-bold text-[#FAF6E9] mb-2">No saved cooks yet</h2>
            <p className="text-white/60 mb-6">Calculate a cook plan and save it to see it here.</p>
            <button
              onClick={() => router.push('/calculator')}
              className="bg-[#3A4A3E] hover:bg-[#4A5A4E] transition-colors text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              Start a new cook
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedSaves.map((save, index) => {
              const cutName = save.cutName;
              const dateObj = new Date(save.savedAt);
              const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const isExpanded = expandedId === save.saveId;
              
              return (
                <div 
                  key={save.saveId}
                  className={`relative bg-[#1C2A1E] border transition-colors rounded-2xl p-5 flex flex-col gap-4 overflow-hidden ${isExpanded ? 'border-[#5A9B6A]/50 bg-[#243627]' : 'border-white/5 hover:border-white/20'}`}
                >
                  {/* Leaderboard Rank Icon (for top 3 rated) */}
                  {(save.rating === 5 || save.rating === 4) && index < 3 && (
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <span className="text-6xl">🏆</span>
                    </div>
                  )}

                  {/* Header row: Title & Delete */}
                  <div className="flex justify-between items-start z-10">
                    <div className="flex flex-col cursor-pointer" onClick={() => handleLoad(save)}>
                      <span className="text-xs text-[#5A9B6A] font-bold uppercase tracking-wider mb-1">{save.method} &middot; {dateStr}</span>
                      <h3 className="text-2xl font-black text-[#FAF6E9] leading-tight hover:underline">{cutName}</h3>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDelete(e, save.saveId)}
                      className="text-white/20 hover:text-red-400 transition-colors p-2 -mt-2 -mr-2 z-20"
                      aria-label="Delete save"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 z-10">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={(e) => handleRating(e, save.saveId, star)}
                        className={`text-2xl transition-transform hover:scale-110 active:scale-90 ${star <= (save.rating || 0) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10 hover:text-white/30'}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-3 text-sm text-white/40 italic">
                      {save.rating ? `${save.rating}/5 Rating` : 'Rate this cook!'}
                    </span>
                  </div>

                  {/* Notes Field */}
                  <div className="z-10">
                    <textarea
                      placeholder="Add notes about this cook... (e.g., 'Used cherry wood, guests loved it!')"
                      value={save.notes || ''}
                      onChange={(e) => handleNotes(save.saveId, e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#5A9B6A]/50 focus:bg-black/40 transition-all resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Expandable Technical Details */}
                  <div className="z-10 border-t border-white/5 pt-2 mt-2">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : save.saveId)}
                      className="flex items-center gap-2 text-sm text-[#5A9B6A] hover:text-[#FAF6E9] transition-colors w-full"
                    >
                      <svg 
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      {isExpanded ? 'Hide Details' : 'View Cook Details'}
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mt-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">⚖️</span> 
                              <span className="font-mono">{save.weightKg} kg</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">⏱️</span> 
                              <span className="font-mono">{save.cookTimeHours} hr</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">🔥</span> 
                              <span className="font-mono">{save.internalTempC}°C internal</span>
                            </div>
                             <div className="w-full mt-2">
                                <button 
                                  onClick={() => handleLoad(save)}
                                  className="text-xs text-[#FAF6E9] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                >
                                  Load this exact plan &rarr;
                                </button>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
