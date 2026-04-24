-- ┌───────────────────────────────────────────────────────────────┐
-- │  Vishal AI — Chat Tables (CLEAN INSTALL)                      │
-- │  Drops old tables and recreates with new paired schema        │
-- └───────────────────────────────────────────────────────────────┘

drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;

-- ─── Conversations Table ────────────────────────────────────────
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_email text,
  user_name text,
  title text default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Messages Table (paired: user + AI in one row) ──────────────
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  user_email text,
  user_name text,
  user_message text not null,
  ai_response text,
  asked_at text,
  replied_at text,
  metadata jsonb,
  created_at timestamptz default now(),
  responded_at timestamptz
);

-- ─── Indexes ────────────────────────────────────────────────────
create index idx_conversations_user on public.conversations(user_id);
create index idx_conversations_updated on public.conversations(updated_at desc);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_created on public.messages(created_at);
create index idx_messages_user on public.messages(user_id);

-- ─── RLS ────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select using (auth.uid() = user_id);
create policy "Users can create own conversations"
  on public.conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations"
  on public.conversations for update using (auth.uid() = user_id);
create policy "Users can delete own conversations"
  on public.conversations for delete using (auth.uid() = user_id);

create policy "Users can view own messages"
  on public.messages for select
  using (exists (select 1 from public.conversations where id = messages.conversation_id and user_id = auth.uid()));
create policy "Users can insert own messages"
  on public.messages for insert
  with check (exists (select 1 from public.conversations where id = messages.conversation_id and user_id = auth.uid()));
create policy "Users can update own messages"
  on public.messages for update
  using (exists (select 1 from public.conversations where id = messages.conversation_id and user_id = auth.uid()));
