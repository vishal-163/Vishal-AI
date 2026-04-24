'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isChat = pathname === '/dashboard' || pathname.startsWith('/dashboard/chat/');
  const isKeys = pathname === '/dashboard/keys';
  const isSettings = pathname === '/dashboard/settings';

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  }, [supabase]);

  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (data) setConversations(data);
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfile();
    loadConversations();
  }, [loadProfile, loadConversations]);

  // Refresh sidebar when navigating or when custom event fires
  useEffect(() => {
    if (isChat) loadConversations();
  }, [pathname, isChat, loadConversations]);

  useEffect(() => {
    const handler = () => {
      loadConversations();
      loadProfile();
    };
    window.addEventListener('refresh-sidebar', handler);
    return () => window.removeEventListener('refresh-sidebar', handler);
  }, [loadConversations, loadProfile]);

  async function handleNewChat() {
    setSidebarOpen(false);
    router.push('/dashboard');
  }

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = confirm('Delete this conversation? This cannot be undone.');
    if (!confirmed) return;
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (pathname === `/dashboard/chat/${id}`) {
      router.push('/dashboard');
    }
  }

  async function handleSignOut() {
    const confirmed = confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  // Formatting chats for display
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayChats = conversations.filter(c => new Date(c.updated_at) >= today);
  const olderChats = conversations.filter(c => new Date(c.updated_at) < today);

  function renderChatGroup(label: string, chats: Conversation[]) {
    if (chats.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
        {chats.map(conv => {
          const active = pathname === `/dashboard/chat/${conv.id}`;
          return (
            <Link
              key={conv.id}
              href={`/dashboard/chat/${conv.id}`}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-600 hover:text-red-400 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#09090b] flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#0c0c0e] border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-3">
          <button onClick={handleNewChat} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-zinc-200 font-medium hover:bg-white/[0.08] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        <nav className="flex-1 px-2 overflow-y-auto scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-zinc-600">No conversations yet</div>
          ) : (
            <>
              {renderChatGroup('Today', todayChats)}
              {renderChatGroup('Older', olderChats)}
            </>
          )}
        </nav>

        <div className="p-2 border-t border-white/[0.06] space-y-0.5">
          <Link href="/dashboard/keys" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isKeys ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499" strokeLinecap="round" strokeLinejoin="round" /></svg>
            API Keys
          </Link>
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isSettings ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Settings
          </Link>
        </div>

        <div className="p-2 border-t border-white/[0.06] relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-zinc-200 truncate">{profile?.name || 'User'}</p>
            </div>
          </button>
          {showMenu && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-[#18181b] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden p-1">
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-red-400 hover:bg-white/[0.04] transition-colors rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#09090b] lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeWidth={2} /></svg></button>
          <span className="text-sm font-medium text-zinc-200">Vishal AI</span>
          <button onClick={handleNewChat} className="p-2 text-zinc-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth={2} /></svg></button>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
