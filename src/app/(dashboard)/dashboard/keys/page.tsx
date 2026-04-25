'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';
import type { ApiKey, ApiKeyCreateResponse } from '@/types';

export default function ApiKeysPage() {
  const supabase = createClient();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreateResponse | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadKeys = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setKeys(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'Default Key' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create key');
      }

      const data: ApiKeyCreateResponse = await res.json();
      setNewKey(data);
      setNewKeyName('');
      loadKeys();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create key');
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) return;

    await supabase
      .from('api_keys')
      .update({ is_revoked: true })
      .eq('id', id);

    loadKeys();
  }

  async function renameKey(id: string) {
    if (!editName.trim()) return;

    await supabase
      .from('api_keys')
      .update({ name: editName })
      .eq('id', id);

    setEditingId(null);
    setEditName('');
    loadKeys();
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">API Keys</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Manage your API keys for authentication</p>
        </div>
        <button onClick={() => { setShowCreate(true); setNewKey(null); }} className="btn-primary w-full sm:w-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Generate Key
        </button>
      </div>

      {/* New Key Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => { if (!newKey) setShowCreate(false); }}>
          <div className="glass-card w-full sm:max-w-md p-6 rounded-t-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {newKey ? (
              /* Show created key */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Key Created</h3>
                    <p className="text-xs text-zinc-500">Copy your key now. It won&apos;t be shown again.</p>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-emerald-300 break-all border border-emerald-500/10 mb-4">
                  {newKey.key}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(newKey.key)}
                    className="btn-primary flex-1"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        Copy Key
                      </>
                    )}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-secondary">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create key form */
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Generate New API Key</h3>
                <p className="text-sm text-zinc-500 mb-6">Give your key a name for easy identification.</p>

                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My Website, Chatbot, Dev"
                  className="input-field mb-4"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button onClick={createKey} disabled={creating} className="btn-primary flex-1">
                    {creating ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      'Generate'
                    )}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="glass-card overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <p className="text-zinc-300 font-medium mb-1">No API keys yet</p>
            <p className="text-sm text-zinc-600 mb-4">Generate your first key to start using the API</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Generate Your First Key</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Key</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Usage</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Used</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      {editingId === key.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-field !py-1.5 !px-3 !text-xs w-32"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && renameKey(key.id)}
                          />
                          <button onClick={() => renameKey(key.id)} className="text-brand-400 hover:text-brand-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-200 font-medium">{key.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-zinc-500 font-mono bg-black/30 px-2 py-1 rounded">{key.key_prefix}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400">{key.usage_count} requests</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">{timeAgo(key.last_used_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {key.is_revoked ? (
                        <span className="badge-revoked">Revoked</span>
                      ) : (
                        <span className="badge-active">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!key.is_revoked && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingId(key.id); setEditName(key.name); }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
                            title="Rename"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => revokeKey(key.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Revoke"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-white/[0.04]">
              {keys.map((key) => (
                <div key={key.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-200 font-medium">{key.name}</span>
                    {key.is_revoked ? (
                      <span className="badge-revoked">Revoked</span>
                    ) : (
                      <span className="badge-active">Active</span>
                    )}
                  </div>
                  <code className="block text-xs text-zinc-500 font-mono bg-black/30 px-2 py-1 rounded w-fit">{key.key_prefix}</code>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{key.usage_count} requests</span>
                    <span>{timeAgo(key.last_used_at)}</span>
                  </div>
                  {!key.is_revoked && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => { setEditingId(key.id); setEditName(key.name); }}
                        className="flex-1 text-center py-2 rounded-lg text-xs font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="flex-1 text-center py-2 rounded-lg text-xs font-medium text-red-400/70 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
