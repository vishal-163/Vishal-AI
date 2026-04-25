'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { renderMarkdown } from '@/components/Markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
  queryType?: string;
}

function getISTTime() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSources, setActiveSources] = useState<{ title: string; url: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationRef = useRef<number | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      // Primary fetch with metadata
      const { data, error } = await supabase
        .from('messages')
        .select('user_message, ai_response, metadata')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn("Primary fetch failed, trying fallback:", error.message);
        // Fallback fetch without metadata if migration is missing
        const { data: fallbackData } = await supabase
          .from('messages')
          .select('user_message, ai_response')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });
        
        if (fallbackData) {
          setMessages(fallbackData.map(row => ([
            { role: 'user', content: row.user_message },
            ...(row.ai_response ? [{ role: 'assistant', content: row.ai_response }] : [])
          ])).flat() as Message[]);
        }
      } else if (data) {
        const flat: Message[] = [];
        data.forEach(row => {
          flat.push({ role: 'user', content: row.user_message });
          if (row.ai_response) {
            flat.push({ 
              role: 'assistant', 
              content: row.ai_response,
              sources: (row.metadata as any)?.sources,
              queryType: (row.metadata as any)?.query_type
            });
          }
        });
        setMessages(flat);
      }
    } catch (err) {
      console.error("Critical error loading messages:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedContent]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  function animateTyping(fullText: string, onComplete: () => void) {
    let index = 0;
    setIsAnimating(true);
    setDisplayedContent('');

    const speed = 10;
    let lastTime = 0;

    function step(timestamp: number) {
      if (timestamp - lastTime >= speed) {
        const charsToAdd = Math.min(3 + Math.floor(Math.random() * 3), fullText.length - index);
        index += charsToAdd;
        setDisplayedContent(fullText.slice(0, index));
        lastTime = timestamp;
      }

      if (index < fullText.length) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
        onComplete();
      }
    }

    animationRef.current = requestAnimationFrame(step);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setActiveSources([]);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user ? await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', user.id)
        .single() : { data: null };

      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          _playground: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Request failed');
      }

      const data = await res.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'No response';
      const sources = data._meta?.sources || [];
      const queryType = data._meta?.query_type;

      if (sources.length > 0) setActiveSources(sources);

      animateTyping(assistantContent, async () => {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: assistantContent,
          sources,
          queryType
        }]);
        setDisplayedContent('');
      });

      await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          user_id: user?.id,
          user_email: profile?.email || user?.email || '',
          user_name: profile?.name || '',
          user_message: userMessage,
          ai_response: assistantContent,
          asked_at: getISTTime(),
          replied_at: getISTTime(),
          responded_at: new Date().toISOString(),
          metadata: data._meta
        });

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      window.dispatchEvent(new Event('refresh-sidebar'));
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Something went wrong. ${err instanceof Error ? err.message : ''}` },
      ]);
    }

    setLoading(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (initialLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
          {messages.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            const isLastAssistant = isAssistant && i === messages.length - 1;
            const content = isLastAssistant && isAnimating ? displayedContent : msg.content;
            const sources = isLastAssistant && isAnimating ? activeSources : msg.sources;

            return (
              <div key={i} className={`flex gap-5 ${isAssistant ? '' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold mt-1 ${
                  isAssistant
                    ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isAssistant ? 'V' : 'U'}
                </div>
                <div className={`flex-1 min-w-0 ${isAssistant ? '' : 'max-w-[85%] text-right'}`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${isAssistant ? '' : 'justify-end'}`}>
                    <p className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
                      {isAssistant ? 'Vishal AI' : 'You'}
                    </p>
                    {isAssistant && msg.queryType && (
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.05] text-[9px] text-brand-400 font-bold uppercase tracking-widest">
                        {msg.queryType}
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-[15px] leading-relaxed relative group ${
                    isAssistant ? 'text-zinc-200' : 'bg-brand-500/10 px-5 py-3.5 rounded-2xl rounded-tr-none border border-brand-500/20 inline-block text-white'
                  }`}>
                    {isAssistant ? (
                      <div className="space-y-4">
                        <div className="markdown-container">
                          {renderMarkdown(content)}
                        </div>
                        {isLastAssistant && isAnimating && (
                          <span className="inline-block w-1.5 h-4 bg-brand-400 ml-1 animate-pulse align-middle" />
                        )}
                        {!isAnimating && i === messages.length - 1 && content && !loading && (
                          <div className="pt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => copyToClipboard(content)}
                              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-white transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                              Copy
                            </button>
                            <button 
                              onClick={() => {
                                setInput(messages[i-1]?.content || '');
                                handleSend();
                              }}
                              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-white transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Regenerate
                            </button>
                          </div>
                        )}
                      </div>
                    ) : content}

                    {isAssistant && sources && sources.length > 0 && !isAnimating && (
                      <div className="mt-8 pt-5 border-t border-white/[0.04] bg-white/[0.01] -mx-2 px-2 rounded-lg">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-4 flex items-center gap-2">
                          <span className="w-4 h-[1px] bg-zinc-800" />
                          Sources & Citations
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {sources.map((src, idx) => (
                            <a 
                              key={idx} 
                              href={src.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-500/20 transition-all text-sm group/link"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center text-[10px] font-mono text-zinc-500 group-hover/link:text-brand-400 transition-colors">
                                {idx + 1}
                              </div>
                              <span className="flex-1 truncate text-zinc-400 group-hover/link:text-zinc-200 transition-colors">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && !isAnimating && (
            <div className="flex gap-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">V</div>
              <div className="flex items-center gap-1.5 py-2">
                <div className="w-2 h-2 rounded-full bg-brand-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-500/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-500/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl sticky bottom-0 safe-bottom">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Message Vishal AI..."
              rows={1}
              disabled={loading || isAnimating}
              className="w-full px-5 py-4 pr-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-[15px] placeholder:text-zinc-600 resize-none outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/10 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || isAnimating}
              className="absolute right-3 bottom-2.5 p-2.5 rounded-xl bg-brand-500 text-white disabled:opacity-20 disabled:grayscale hover:bg-brand-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-500 font-bold tracking-widest mt-3 uppercase opacity-50">Vishal AI Premium Experience • Built by Vishal R</p>
        </div>
      </div>
    </div>
  );
}
