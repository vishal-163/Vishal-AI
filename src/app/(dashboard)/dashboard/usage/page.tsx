'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';

export default function UsagePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<{ date: string; requests: number; tokens: number }[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

  useEffect(() => {
    async function loadUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logs } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (logs) {
        // Aggregate by day
        const byDay = new Map<string, { requests: number; tokens: number }>();

        // Pre-fill last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          byDay.set(key, { requests: 0, tokens: 0 });
        }

        logs.forEach((log) => {
          const day = new Date(log.created_at).toISOString().split('T')[0];
          const existing = byDay.get(day) || { requests: 0, tokens: 0 };
          existing.requests += 1;
          existing.tokens += log.total_tokens || 0;
          byDay.set(day, existing);
        });

        const daily = Array.from(byDay.entries()).map(([date, data]) => ({
          date,
          ...data,
        }));

        setDailyData(daily);
        setTotalRequests(logs.length);
        setTotalTokens(logs.reduce((s, l) => s + (l.total_tokens || 0), 0));
        setAvgLatency(
          logs.length > 0
            ? Math.round(logs.reduce((s, l) => s + (l.latency_ms || 0), 0) / logs.length)
            : 0
        );
      }

      setLoading(false);
    }

    loadUsage();
  }, [supabase]);

  const maxRequests = Math.max(...dailyData.map((d) => d.requests), 1);
  const maxTokens = Math.max(...dailyData.map((d) => d.tokens), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Usage</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">Monitor your API consumption over the last 30 days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Requests</span>
          <span className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(totalRequests)}</span>
          <span className="text-xs text-zinc-600">Last 30 days</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Tokens</span>
          <span className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(totalTokens)}</span>
          <span className="text-xs text-zinc-600">Last 30 days</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Latency</span>
          <span className="text-2xl sm:text-3xl font-bold text-white">{avgLatency}ms</span>
          <span className="text-xs text-zinc-600">Per request</span>
        </div>
      </div>

      {/* Daily Requests Chart */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-xs sm:text-sm font-semibold text-zinc-200 mb-4 sm:mb-6">Daily Requests</h2>
        <div className="flex items-end gap-[2px] sm:gap-[3px] h-28 sm:h-40">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-zinc-800 border border-white/[0.1] rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="text-zinc-300 font-medium">{d.date}</p>
                  <p className="text-zinc-500">{d.requests} requests</p>
                </div>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400 opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-h-[2px]"
                style={{ height: `${(d.requests / maxRequests) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-600">
          <span>{dailyData[0]?.date?.slice(5)}</span>
          <span>{dailyData[dailyData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>

      {/* Token Usage Chart */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-xs sm:text-sm font-semibold text-zinc-200 mb-4 sm:mb-6">Token Usage</h2>
        <div className="flex items-end gap-[2px] sm:gap-[3px] h-28 sm:h-40">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-zinc-800 border border-white/[0.1] rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="text-zinc-300 font-medium">{d.date}</p>
                  <p className="text-zinc-500">{formatNumber(d.tokens)} tokens</p>
                </div>
              </div>
              <div
                className="w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400 opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-h-[2px]"
                style={{ height: `${(d.tokens / maxTokens) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-600">
          <span>{dailyData[0]?.date?.slice(5)}</span>
          <span>{dailyData[dailyData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}
