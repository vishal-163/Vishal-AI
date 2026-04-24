'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function PlaygroundPage() {
  const supabase = createClient();
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Load user's first active API key
  useEffect(() => {
    async function loadKey() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('api_keys')
        .select('key_prefix')
        .eq('user_id', user.id)
        .eq('is_revoked', false)
        .limit(1)
        .single();

      if (data) setApiKey(data.key_prefix);
    }
    loadKey();
  }, [supabase]);

  async function handleSend() {
    if (!userInput.trim() || streaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userInput },
    ];
    setMessages(newMessages);
    setUserInput('');
    setStreaming(true);

    const allMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...newMessages,
    ];

    // Add empty assistant message for streaming
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          temperature,
          max_tokens: maxTokens,
          stream: false, // Use non-streaming for playground simplicity
          _playground: true, // Internal flag to bypass API key auth
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Request failed');
      }

      const data = await res.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'No response';

      setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ]);
    }

    setStreaming(false);
  }

  function clearChat() {
    setMessages([]);
  }

  async function copyResponse() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Playground</h1>
          <p className="text-sm text-zinc-500 mt-1">Test the Vishal AI model</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyResponse} disabled={messages.length === 0} className="btn-ghost">
            {copied ? '✓ Copied' : 'Copy Response'}
          </button>
          <button onClick={clearChat} disabled={messages.length === 0} className="btn-ghost">
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model</label>
              <div className="input-field !bg-white/[0.02] text-zinc-400 cursor-default">vishal-ai-v1</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>128</span>
                <span>8192</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="input-field resize-none text-xs"
                placeholder="You are a helpful assistant..."
              />
            </div>
          </div>

          {apiKey && (
            <div className="glass-card p-4">
              <p className="text-xs text-zinc-500 mb-1">Active Key</p>
              <code className="text-xs text-zinc-400 font-mono">{apiKey}</code>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Messages */}
          <div
            ref={responseRef}
            className="glass-card flex-1 min-h-[400px] max-h-[600px] overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-400">Start a conversation</p>
                  <p className="text-xs text-zinc-600 mt-1">Type a message below to test the API</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0 text-white text-xs font-bold mt-0.5">
                      V
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500/20 text-zinc-200 border border-brand-500/20'
                        : 'bg-white/[0.03] text-zinc-300 border border-white/[0.06]'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{msg.content || (streaming && i === messages.length - 1 ? '...' : '')}</pre>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 text-xs font-bold mt-0.5">
                      U
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="input-field flex-1"
              disabled={streaming}
            />
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || streaming}
              className="btn-primary !px-6"
            >
              {streaming ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
