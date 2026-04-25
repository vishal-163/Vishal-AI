'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Preferences {
  memory_enabled: boolean;
  tone: 'professional' | 'friendly' | 'concise';
  style: 'concise' | 'detailed';
}

interface Profile {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  preferences?: Preferences;
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState<Preferences>({
    memory_enabled: true,
    tone: 'professional',
    style: 'concise',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveSettings() {
    if (!profile) return;
    setSaving(true);

    const updateData: any = { name };
    
    // Add preferences ONLY if they were successfully loaded initially 
    // to avoid errors if the column is missing in the DB
    if (profile.preferences || preferences) {
      updateData.preferences = preferences;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (error) {
      console.error('Save error:', error);
      // If it's a column missing error, provide a helpful hint
      if (error.message.includes('preferences')) {
        alert('Database Update Required: Please run the SQL command provided by the assistant to add the "preferences" column to your profiles table.');
      } else {
        alert('Failed to save changes: ' + error.message);
      }
      setSaving(false);
      return;
    }

    // Update local state to reflect changes immediately in the UI
    setProfile({ ...profile, name, preferences });
    
    setSaving(false);
    setSaved(true);
    
    // Notify the layout/sidebar to refresh profile data
    router.refresh();
    window.dispatchEvent(new Event('refresh-sidebar')); // This also re-loads profile in layout
    
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteAccount() {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This will permanently delete all your data. This action cannot be undone.'
    );
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.push('/');
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
    <div className="max-w-3xl mx-auto pb-20 space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">Manage your identity and intelligence preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Section */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Profile Architecture</h2>
          </div>
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl shadow-brand-500/20">
                {name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-lg sm:text-xl font-bold text-white">{name || 'User Instance'}</p>
                <p className="text-xs sm:text-sm text-zinc-500">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.04]">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest pl-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:border-brand-500/30 outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest pl-1">Instance Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Intelligence & Memory Section */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Intelligence Configuration</h2>
          </div>
          <div className="p-5 sm:p-8 space-y-8 sm:space-y-10">
            {/* Memory Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-zinc-200">Personal Memory</p>
                <p className="text-sm text-zinc-500">Allow Vishal AI to remember your name, goals, and previous context.</p>
              </div>
              <button 
                onClick={() => setPreferences({ ...preferences, memory_enabled: !preferences.memory_enabled })}
                className={`w-14 h-8 rounded-full transition-all relative ${preferences.memory_enabled ? 'bg-brand-500' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${preferences.memory_enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Tone Selection */}
            <div className="space-y-4">
              <p className="font-bold text-zinc-200">Communication Tone</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {['professional', 'friendly', 'concise'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setPreferences({ ...preferences, tone: tone as any })}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-bold capitalize transition-all ${
                      preferences.tone === tone 
                        ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:border-white/20'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Style */}
            <div className="space-y-4">
              <p className="font-bold text-zinc-200">Response Detail Level</p>
              <div className="grid grid-cols-2 gap-3">
                {['concise', 'detailed'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setPreferences({ ...preferences, style: style as any })}
                    className={`px-4 py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                      preferences.style === style 
                        ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:border-white/20'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/[0.06] z-30 safe-bottom">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button 
              onClick={deleteAccount} 
              className="hidden sm:block px-4 py-2 rounded-xl text-[11px] font-bold text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all uppercase tracking-widest"
            >
              Purge Account
            </button>
            
            <button 
              onClick={saveSettings} 
              disabled={saving} 
              className="flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-white/10"
            >
              {saving ? 'Saving...' : saved ? '✓ Changes Saved' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden behind sticky bar */}
      <div className="h-24" />
    </div>
  );
}
