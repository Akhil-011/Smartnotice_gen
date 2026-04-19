export type UserRole = 'admin' | 'faculty' | 'student' | 'parent';

export type NoticeAudience = 'students' | 'parents' | 'staff' | 'guests';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  audiences: string[];
  is_pinned: boolean;
  priority: 'normal' | 'high' | 'urgent';
  email_notification: boolean;
  created_at: string;
  updated_at: string;
  category?: string;
  expiry_date?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Reaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'love' | 'helpful' | 'important';
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}
