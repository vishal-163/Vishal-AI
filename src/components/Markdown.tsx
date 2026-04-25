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

    // Process regular text
    const lines = part.split('\n');
    return (
      <React.Fragment key={partIndex}>
        {lines.map((line, lineIndex) => {
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

          // Lists
          const bulletMatch = line.match(/^(\s*)([-*•])\s(.*)/);
          if (bulletMatch) {
            const indent = bulletMatch[1].length;
            return (
              <div key={lineIndex} className="flex gap-2 items-start" style={{ paddingLeft: `${Math.min(indent, 4) * 6}px` }}>
                <span className="text-brand-400 mt-1.5 text-[8px]">●</span>
                <span>{processInline(bulletMatch[3])}</span>
              </div>
            );
          }

          const numMatch = line.match(/^(\s*)(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={lineIndex} className="flex gap-2 items-start">
                <span className="text-brand-400 font-medium min-w-[1.2rem] text-right">{numMatch[2]}.</span>
                <span>{processInline(numMatch[3])}</span>
              </div>
            );
          }

          // Tables (Simple detection)
          if (line.includes('|') && line.trim().startsWith('|')) {
            const cells = line.split('|').filter(c => c.trim() !== '' || line.indexOf(c) > 0 && line.indexOf(c) < line.length - 1);
            if (cells.length > 0) {
              return (
                <div key={lineIndex} className="overflow-x-auto my-2">
                  <table className="min-w-full border-collapse border border-white/10 text-sm">
                    <tbody>
                      <tr className="border-b border-white/10">
                        {cells.map((cell, i) => (
                          <td key={i} className="px-3 py-2 border-r border-white/10">{processInline(cell.trim())}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            }
          }

          return <div key={lineIndex}>{processInline(line)}</div>;
        })}
      </React.Fragment>
    );
  });
}

/** Process inline markdown: bold, italic, code, links */
function processInline(text: string): React.ReactNode {
  if (!text) return text;

  // Regex to match: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-brand-300 text-[13px] font-mono">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
            {match[1]}
          </a>
        );
      }
    }
    return part;
  });
}
