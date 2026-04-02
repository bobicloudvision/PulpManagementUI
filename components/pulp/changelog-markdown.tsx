"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";

const components: Partial<Components> = {
  h1: ({ children, ...props }) => (
    <h1
      className="mb-3 border-b border-zinc-200/80 pb-2 text-xl font-semibold tracking-tight text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-sky-700 underline decoration-sky-400/70 underline-offset-2 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`block overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${className ?? ""}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.8125rem] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="mb-3 overflow-x-auto rounded-md" {...props}>
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-3 border-l-2 border-zinc-300 pl-3 text-sm text-zinc-600 italic dark:border-zinc-600 dark:text-zinc-400"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

export function ChangelogMarkdown({ source }: { source: string }) {
  return <Markdown components={components}>{source}</Markdown>;
}
