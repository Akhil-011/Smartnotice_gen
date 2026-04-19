# Notice Comments & Replies Feature

## Overview

The Smart Notice Board includes a comprehensive commenting system that allows users to engage with notices through comments and replies based on their roles.

## Commenting Permissions

### Who Can Comment:
- ✅ **Students** - Can comment on any notice
- ✅ **Parents** - Can comment on any notice
- ✅ **Faculty** - Can comment on any notice
- ✅ **Admin** - Can comment on any notice

**Note:** Users must be logged in to comment. Non-authenticated users will see a message saying "Please log in to comment on this notice."

### Comment Display:
- Each comment shows:
  - User avatar or initial
  - User name
  - User role (admin, faculty, student, parent)
  - Comment text
  - Timestamp (MMM dd, yyyy - h:mm a)
  - Reply button (for admin/faculty only)

## Reply Permissions

### Who Can Reply to Comments:
- ✅ **Admin** - Can reply to any comment
- ✅ **Faculty** - Can reply to any comment
- ❌ **Students** - Cannot reply (view only)
- ❌ **Parents** - Cannot reply (view only)

### Reply Display:
- Replies appear indented under their parent comment
- Replies have the same structure as comments but are nested
- Only admin and faculty see the "Reply" button

## User Flow

### For Students/Parents/Faculty (Commenting):
1. Open a notice from the dashboard
2. Scroll to the "Comments" section
3. Fill in the text area with your comment
4. Click "Post Comment"
5. Your comment appears immediately

### For Admin/Faculty (Replying):
1. Open a notice from the dashboard
2. Scroll to the "Comments" section
3. Find a comment you want to reply to
4. Click the "Reply" button on that comment
5. Type your reply in the nested form
6. Click "Reply to post your response
7. Your reply appears indented under the original comment

## Database Schema

The `notice_comments` table has been updated to support replies:

```sql
create table public.notice_comments (
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
```

### Key Fields:
- `parent_comment_id` - Links replies to their parent comment (null for top-level comments)
- `user_role` - Tracks the user's role at the time of commenting

## RLS Policies

All authenticated users can:
- ✅ Read all comments and replies
- ✅ Insert comments and replies (their own)
- ✅ Update their own comments
- ✅ Delete their own comments

## Installation / Migration

If upgrading from an older version:

1. Run the migration script:
```bash
# In Supabase SQL Editor, run:
cat supabase/migrations/add_reply_and_role_to_comments.sql
```

Or manually execute the SQL in your Supabase dashboard:

```sql
alter table public.notice_comments
add column if not exists parent_comment_id uuid references public.notice_comments(id) on delete cascade,
add column if not exists user_role text;

create index if not exists notice_comments_parent_id_idx on public.notice_comments (parent_comment_id);
```

2. Redeploy the application

## Testing

### Test Cases:

1. **Student Comment:**
   - Log in as a student
   - Open a notice
   - Add a comment
   - Verify comment appears with "student" role badge
   - Verify no "Reply" button visible

2. **Faculty Reply:**
   - Log in as faculty
   - Open a notice with student comments
   - Click "Reply" on a student comment
   - Type a reply
   - Verify reply appears indented under the original comment
   - Verify reply shows "faculty" role badge

3. **Admin Override:**
   - Log in as admin
   - Verify admin can comment like any user
   - Verify admin can reply like faculty
   - Verify admin can delete their own comments

4. **Anonymous User:**
   - Log out or open in private window
   - Verify comment form shows "Please log in" message
   - Verify no comment input available

## Future Enhancements

Potential improvements:
- Edit comments (update your own comment)
- Delete comments (admin/faculty delete any)
- Like/react to comments
- Mention users in comments (@username)
- Rich text editor support
- Nested replies (replies to replies)
- Email notifications on replies
- Comment threading view
