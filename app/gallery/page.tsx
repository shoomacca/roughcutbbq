'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GearRecommendation from '@/components/GearRecommendation';
import UploadFlow from '@/components/gallery/UploadFlow';

interface GalleryPost {
  id: string;
  before_url: string;
  after_url: string;
  name: string | null;
  cut: string;
  method: string;
  gear_used: string | null;
  report_count: number;
  created_at: string;
  star_count: number;
  comment_count: number;
  has_starred: boolean;
}

interface Comment {
  id: number;
  postId: string;
  text: string;
  createdAt: string;
  authorName: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-brand-surface border border-white/5 animate-pulse p-4">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 aspect-square bg-white/5 rounded-lg" />
        <div className="flex-1 aspect-square bg-white/10 rounded-lg" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    </div>
  );
}

function PostCard({
  post,
  user,
  onReport,
}: {
  post: GalleryPost;
  user: { id: number; email: string } | null;
  onReport: (id: string) => void;
}) {
  const router = useRouter();
  const [reported, setReported] = useState(false);
  const [hasStarred, setHasStarred] = useState(post.has_starred);
  const [starCount, setStarCount] = useState(post.star_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = () => {
    if (reported) return;
    fetch('/api/gallery/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id }),
    }).catch(() => {});
    const key = `bbq_reported_${post.id}`;
    sessionStorage.setItem(key, '1');
    setReported(true);
    onReport(post.id);
  };

  const handleStarToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/gallery/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setHasStarred(data.starred);
        setStarCount(data.starCount);
      }
    } catch (e) {
      console.error('Failed to toggle star:', e);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/gallery/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (nextState) {
      loadComments();
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gallery/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, commentText: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentCount((prev) => prev + 1);
        setCommentText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem(`bbq_reported_${post.id}`)) {
      Promise.resolve().then(() => setReported(true));
    }
  }, [post.id]);

  return (
    <div className="rounded-2xl bg-brand-surface border border-white/5 flex flex-col p-4 shadow-lg hover:border-brand-muted/20 transition-all">
      {/* Post Author / Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <p className="text-brand-secondary text-sm font-black italic tracking-wide truncate">
            👤 {post.name}
          </p>
          <p className="text-[10px] text-brand-muted mt-0.5">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        
        <button
          onClick={handleReport}
          disabled={reported}
          title={reported ? 'Reported' : 'Report post'}
          className="text-brand-muted/30 hover:text-brand-primary disabled:opacity-20 transition-colors text-sm cursor-pointer"
        >
          {reported ? '✓' : '⚑'}
        </button>
      </div>

      {/* Before / After images side-by-side */}
      <div className="flex gap-2.5 mb-3.5">
        <div className="relative flex-1 aspect-square rounded-xl overflow-hidden bg-brand-dark/50 border border-white/5">
          <Image
            src={post.before_url}
            alt={`Before — ${post.cut}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40vw, 250px"
          />
          <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider">
            BEFORE
          </span>
        </div>
        <div className="relative flex-1 aspect-square rounded-xl overflow-hidden bg-brand-dark/50 border border-white/5">
          <Image
            src={post.after_url}
            alt={`After — ${post.cut}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40vw, 250px"
          />
          <span className="absolute top-1.5 left-1.5 bg-brand-secondary/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider">
            AFTER
          </span>
        </div>
      </div>

      {/* Post details */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
          <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-muted font-bold px-2 py-0.5 rounded-lg">
            🥩 {post.cut}
          </span>
          <span className="text-[10px] bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary font-bold px-2 py-0.5 rounded-lg">
            🔥 {post.method}
          </span>
        </div>
        {post.gear_used && (
          <p className="text-brand-text/90 text-xs italic bg-brand-dark/40 px-3 py-2 rounded-xl border border-white/5">
            <span className="font-semibold text-brand-muted text-[10px] uppercase block tracking-wider mb-0.5">Gear:</span>
            {post.gear_used}
          </p>
        )}
      </div>

      {/* Star / Comment actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
        <button
          onClick={handleStarToggle}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
            hasStarred ? 'text-brand-secondary scale-105' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <span>{hasStarred ? '★' : '☆'}</span>
          <span>{starCount} {starCount === 1 ? 'Star' : 'Stars'}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            expanded ? 'text-brand-secondary' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <span>💬</span>
          <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>
      </div>

      {/* Collapsible Comment drawer */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
          <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-wider">
            Pitmaster Comments
          </h4>

          {loadingComments && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-brand-secondary/25 border-t-brand-secondary animate-spin" />
            </div>
          )}

          {!loadingComments && comments.length === 0 && (
            <p className="text-brand-muted text-xs italic py-1">No comments yet. Start the conversation!</p>
          )}

          {!loadingComments && comments.length > 0 && (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="bg-brand-dark/40 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] text-brand-muted/75 font-semibold">
                    <span className="text-brand-secondary font-bold">👤 {c.authorName}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-brand-text text-xs leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSendComment} className="flex gap-2 mt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-brand-dark/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-secondary"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="bg-brand-secondary hover:bg-brand-primary disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="bg-brand-dark/30 border border-white/5 rounded-xl py-2 px-3 text-center">
              <p className="text-[11px] text-brand-muted">
                🔒 <Link href="/login" className="text-brand-secondary hover:underline font-semibold">Log in</Link> to share comments
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [cutFilter, setCutFilter] = useState('');
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    // Fetch posts
    fetch('/api/gallery')
      .then((r) => r.json())
      .then(({ posts }) => {
        setPosts(posts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const methods = useMemo(
    () => Array.from(new Set(posts.map((p) => p.method))).sort(),
    [posts]
  );
  const cuts = useMemo(
    () => Array.from(new Set(posts.map((p) => p.cut))).sort(),
    [posts]
  );

  const filtered = useMemo(
    () => posts.filter((p) => {
      if (methodFilter && p.method !== methodFilter) return false;
      if (cutFilter && p.cut !== cutFilter) return false;
      return true;
    }),
    [posts, methodFilter, cutFilter]
  );

  const handleReport = (id: string) => {
    setTimeout(() => setPosts((prev) => prev.filter((p) => p.id !== id)), 1500);
  };

  const handleUploadSuccess = () => {
    // Reload posts feed
    fetch('/api/gallery')
      .then((r) => r.json())
      .then(({ posts }) => setPosts(posts ?? []))
      .catch(() => {});
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-brand-dark">
      {/* Header with Upload Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-brand-text text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            🔥 Community Cook Forum
          </h1>
          <p className="text-brand-muted text-sm mt-1.5">
            Star cooks, chat in comments, and share your before &amp; after masterpieces anonymously
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex-none bg-brand-primary hover:bg-brand-secondary text-white font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>📸</span> Share a New Cook
        </button>
      </div>

      {/* Filter bar */}
      {!loading && posts.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-brand-surface border border-white/10 text-brand-text text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-secondary"
          >
            <option value="">All Methods</option>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={cutFilter}
            onChange={(e) => setCutFilter(e.target.value)}
            className="bg-brand-surface border border-white/10 text-brand-text text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-secondary"
          >
            <option value="">All Cuts</option>
            {cuts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(methodFilter || cutFilter) && (
            <button
              onClick={() => {
                setMethodFilter('');
                setCutFilter('');
              }}
              className="text-brand-muted text-xs hover:text-brand-text transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Forum layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Posts grid */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center gap-4 bg-brand-surface rounded-3xl border border-white/5">
              <span className="text-6xl">🍖</span>
              <p className="text-brand-text font-bold text-lg">
                {posts.length === 0 ? 'No cooks shared yet — be the first!' : 'No cooks match those filters'}
              </p>
              <p className="text-brand-muted text-sm max-w-xs mt-1">
                Upload your photos directly or use the calculator to plan and share your cook.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer"
              >
                Share a Cook Now &rarr;
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} user={user} onReport={handleReport} />
              ))}
            </div>
          )}
        </div>

        {/* Gear Sidebar */}
        <div className="md:w-56 flex-none">
          <GearRecommendation limit={3} title="Shop Featured Gear" />
        </div>
      </div>

      {/* Upload Flow Modal */}
      {showUploadModal && (
        <UploadFlow
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
