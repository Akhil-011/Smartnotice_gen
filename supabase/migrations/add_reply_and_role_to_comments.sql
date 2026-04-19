-- Migration: Add reply and role support to notice_comments
-- This allows comments to have parent/reply relationships and track user roles

-- Add new columns to notice_comments if they don't exist
alter table if exists public.notice_comments
add column if not exists parent_comment_id uuid references public.notice_comments(id) on delete cascade,
add column if not exists user_role text;

-- Add index for parent_comment_id if it doesn't exist
create index if not exists notice_comments_parent_id_idx on public.notice_comments (parent_comment_id);

-- Backfill user_role from profiles
update public.notice_comments nc
set user_role = p.role
from public.profiles p
where nc.user_id = p.id and nc.user_role is null;

-- Make sure this comment insert includes user_role going forward
-- Note: The application code already handles this in the insert statement
