-- ┌───────────────────────────────────────────────────────────────┐
-- │  Vishal API — Database Schema                                │
-- │  Run this SQL in the Supabase SQL Editor                     │
-- │  Dashboard → SQL Editor → New Query → Paste → Run           │
-- └───────────────────────────────────────────────────────────────┘

-- ─── 1. Profiles Table ──────────────────────────────────────────
-- Extends Supabase auth.users with custom profile data
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  preferences jsonb default '{"memory_enabled": true, "tone": "professional", "style": "concise"}'::jsonb,
  created_at timestamptz default now()
);

-- ─── 2. API Keys Table ─────────────────────────────────────────
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text default 'Default Key',
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  is_revoked boolean default false,
  usage_count integer default 0
);

-- ─── 3. Usage Logs Table ────────────────────────────────────────
create table if not exists public.usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  api_key_id uuid references public.api_keys(id) on delete set null,
  model text,
  endpoint text,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  total_tokens integer default 0,
  latency_ms integer default 0,
  status text default 'success',
  error text,
  created_at timestamptz default now()
);

-- ─── 4. Indexes ─────────────────────────────────────────────────
create index if not exists idx_api_keys_hash on public.api_keys(key_hash);
create index if not exists idx_api_keys_user on public.api_keys(user_id);
create index if not exists idx_usage_logs_user on public.usage_logs(user_id);
create index if not exists idx_usage_logs_created on public.usage_logs(created_at);
create index if not exists idx_usage_logs_key on public.usage_logs(api_key_id);

-- ─── 5. Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.usage_logs enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- API Keys: users can CRUD their own keys
create policy "Users can view own keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create own keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

create policy "Users can delete own keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- Usage Logs: users can read their own logs, service role can insert
create policy "Users can view own logs"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "Service role can insert logs"
  on public.usage_logs for insert
  with check (true);

-- ─── 6. Auto-create profile on signup ───────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 7. Increment usage count function ──────────────────────────
create or replace function public.increment_usage_count(key_id uuid)
returns void as $$
begin
  update public.api_keys
  set usage_count = usage_count + 1
  where id = key_id;
end;
$$ language plpgsql security definer;
