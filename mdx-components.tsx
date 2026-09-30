import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-brand-text mt-8 mb-4 leading-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-amber-400 mt-8 mb-3 leading-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-brand-text mt-6 mb-2">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-brand-muted leading-relaxed mb-4">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-brand-muted space-y-1 mb-4 pl-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-brand-muted space-y-1 mb-4 pl-2">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="text-brand-text font-semibold">{children}</strong>,
    a: ({ href, children }) => (
      <Link
        href={href ?? '#'}
        className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
      >
        {children}
      </Link>
    ),
    hr: () => <hr className="border-white/10 my-8" />,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-amber-500/50 pl-4 my-4 text-brand-muted italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-brand-surface text-amber-400 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    ...components,
  };
}
