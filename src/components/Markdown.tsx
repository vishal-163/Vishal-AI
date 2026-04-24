'use client';

import React from 'react';

/**
 * Simple but effective Markdown renderer
 * Handles: bold, italic, code blocks, inline code, lists, headings, links
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, partIndex) => {
    // Code block
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const lang = match?.[1] || '';
      const code = match?.[2]?.trim() || part.slice(3, -3).trim();
      return (
        <div key={partIndex} className="my-3 rounded-xl overflow-hidden border border-white/[0.06]">
          {lang && (
            <div className="px-4 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-[10px] text-zinc-500 font-mono uppercase">{lang}</div>
          )}
          <pre className="p-4 bg-white/[0.02] overflow-x-auto">
            <code className="text-[13px] text-zinc-300 font-mono leading-relaxed">{code}</code>
          </pre>
        </div>
      );
    }

    // Process inline markdown
    const lines = part.split('\n');
    return (
      <React.Fragment key={partIndex}>
        {lines.map((line, lineIndex) => {
          // Empty line = paragraph break
          if (line.trim() === '') {
            return <div key={lineIndex} className="h-2" />;
          }

          // Headings
          if (line.startsWith('### ')) {
            return <h3 key={lineIndex} className="text-base font-semibold text-white mt-3 mb-1">{processInline(line.slice(4))}</h3>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={lineIndex} className="text-lg font-semibold text-white mt-4 mb-1">{processInline(line.slice(3))}</h2>;
          }
          if (line.startsWith('# ')) {
            return <h1 key={lineIndex} className="text-xl font-bold text-white mt-4 mb-2">{processInline(line.slice(2))}</h1>;
          }

          // Bullet lists
          if (/^[-*•]\s/.test(line.trim())) {
            const content = line.trim().replace(/^[-*•]\s/, '');
            const indent = line.match(/^\s*/)?.[0].length || 0;
            return (
              <div key={lineIndex} className="flex gap-2 items-start" style={{ paddingLeft: `${Math.min(indent, 4) * 6}px` }}>
                <span className="text-brand-400 mt-1.5 text-[8px]">●</span>
                <span>{processInline(content)}</span>
              </div>
            );
          }

          // Numbered lists
          if (/^\d+\.\s/.test(line.trim())) {
            const match = line.trim().match(/^(\d+)\.\s(.*)/);
            if (match) {
              return (
                <div key={lineIndex} className="flex gap-2 items-start">
                  <span className="text-brand-400 font-medium min-w-[1.2rem] text-right">{match[1]}.</span>
                  <span>{processInline(match[2])}</span>
                </div>
              );
            }
          }

          // Regular line
          return <div key={lineIndex}>{processInline(line)}</div>;
        })}
      </React.Fragment>
    );
  });
}

/** Process inline markdown: bold, italic, code, links */
function processInline(text: string): React.ReactNode {
  if (!text) return text;

  // Split by inline code, bold, italic, and links
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
    // Link
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    type MatchType = { type: string; match: RegExpMatchArray; pos: number } | null;
    let earliest: MatchType = null;

    if (codeMatch && (!earliest || (codeMatch.index ?? 0) + codeMatch[1].length < earliest.pos)) {
      earliest = { type: 'code', match: codeMatch, pos: codeMatch[1].length };
    }
    if (boldMatch && (!earliest || boldMatch[1].length < earliest.pos)) {
      earliest = { type: 'bold', match: boldMatch, pos: boldMatch[1].length };
    }
    if (linkMatch && (!earliest || linkMatch[1].length < earliest.pos)) {
      earliest = { type: 'link', match: linkMatch, pos: linkMatch[1].length };
    }
    if (italicMatch && !boldMatch && (!earliest || italicMatch[1].length < earliest.pos)) {
      earliest = { type: 'italic', match: italicMatch, pos: italicMatch[1].length };
    }

    if (!earliest) {
      tokens.push(remaining);
      break;
    }

    const m = earliest.match;
    // Add text before match
    if (m[1]) tokens.push(m[1]);

    switch (earliest.type) {
      case 'code':
        tokens.push(
          <code key={keyCounter++} className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-brand-300 text-[13px] font-mono">{m[2]}</code>
        );
        remaining = remaining.slice(m[0].length);
        break;
      case 'bold':
        tokens.push(<strong key={keyCounter++} className="font-semibold text-white">{m[2]}</strong>);
        remaining = remaining.slice(m[0].length);
        break;
      case 'italic':
        tokens.push(<em key={keyCounter++} className="italic text-zinc-300">{m[2]}</em>);
        remaining = remaining.slice(m[0].length);
        break;
      case 'link':
        tokens.push(
          <a key={keyCounter++} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
            {m[2]}
          </a>
        );
        remaining = remaining.slice(m[0].length);
        break;
    }
  }

  return <>{tokens}</>;
}
