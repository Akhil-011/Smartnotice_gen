-- Smart Notice Board: Supabase schema + RLS
-- Run this whole file in Supabase SQL Editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- SECURITY DEFINER helper to read current user's role in RLS policies.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'faculty', 'student', 'parent')),
  avatar text,
  department text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Notices table
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  audiences text[] not null,
  is_pinned boolean not null default false,
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  email_notification boolean not null default false,
  category text,
  expiry_date timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists notices_created_at_idx on public.notices (created_at desc);
create index if not exists notices_is_pinned_idx on public.notices (is_pinned desc);
create index if not exists notices_audiences_gin_idx on public.notices using gin (audiences);

create trigger notices_set_updated_at
before update on public.notices
for each row
execute function public.set_updated_at();

-- Notice comments table
create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  parent_comment_id uuid references public.notice_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  user_avatar text,
  user_role text,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notice_comments_notice_id_idx on public.notice_comments (notice_id);
create index if not exists notice_comments_parent_id_idx on public.notice_comments (parent_comment_id);
create index if not exists notice_comments_created_at_idx on public.notice_comments (created_at desc);

-- Notice reactions table
create table if not exists public.notice_reactions (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  type text not null check (type in ('like', 'heart', 'bookmark', 'important', 'helpful', 'love')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (notice_id, user_id)
);

create index if not exists notice_reactions_notice_id_idx on public.notice_reactions (notice_id);

-- Notice attachments table
create table if not exists public.notice_attachments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  name text not null,
  url text not null,
  size bigint not null,
  type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notice_attachments_notice_id_idx on public.notice_attachments (notice_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.notices enable row level security;
alter table public.notice_comments enable row level security;
alter table public.notice_reactions enable row level security;
alter table public.notice_attachments enable row level security;

-- Profiles policies
create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Notices policies
create policy "Authenticated users can read all notices"
on public.notices
for select
to authenticated
using (true);

create policy "Anonymous users can read guest notices"
on public.notices
for select
to anon
using (audiences @> array['guests']::text[]);

create policy "Faculty or admin can create notices"
on public.notices
for insert
to authenticated
with check (public.get_my_role() in ('faculty', 'admin'));

create policy "Faculty or admin can update notices"
on public.notices
for update
to authenticated
using (public.get_my_role() in ('faculty', 'admin'))
with check (public.get_my_role() in ('faculty', 'admin'));

create policy "Faculty or admin can delete notices"
on public.notices
for delete
to authenticated
using (public.get_my_role() in ('faculty', 'admin'));

-- Notice comments policies
create policy "Users can read all comments"
on public.notice_comments
for select
to authenticated
using (true);

create policy "Users can add comments"
on public.notice_comments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own comments"
on public.notice_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own comments"
on public.notice_comments
for delete
to authenticated
using (auth.uid() = user_id);

-- Notice reactions policies
create policy "Users can read all reactions"
on public.notice_reactions
for select
to authenticated
using (true);

create policy "Users can add or update own reactions"
on public.notice_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own reactions"
on public.notice_reactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own reactions"
on public.notice_reactions
for delete
to authenticated
using (auth.uid() = user_id);

-- Notice attachments policies
create policy "Users can read attachments"
on public.notice_attachments
for select
to authenticated
using (true);

create policy "Faculty or admin can manage attachments"
on public.notice_attachments
for all
to authenticated
using (public.get_my_role() in ('faculty', 'admin'))
with check (public.get_my_role() in ('faculty', 'admin'));

-- Useful grants (default in Supabase, kept explicit for clarity)
grant usage on schema public to anon, authenticated;
grant select on public.notices to anon;
grant select on public.profiles, public.notices, public.notice_comments, public.notice_reactions, public.notice_attachments to authenticated;
grant insert, update, delete on public.profiles, public.notices, public.notice_comments, public.notice_reactions, public.notice_attachments to authenticated;
