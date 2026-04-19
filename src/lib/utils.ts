import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NoticeAudience, UserRole } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInHours < 24) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      -Math.floor(diffInHours),
      'hour'
    );
  } else if (diffInDays < 7) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      -Math.floor(diffInDays),
      'day'
    );
  } else {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function canViewNotice(userRole: UserRole, audiences: NoticeAudience[]): boolean {
  // Admin can see all notices
  if (userRole === 'admin') return true;
  
  // Guests can only see public notices
  if (userRole === 'guest') return audiences.includes('guests');
  
  // Students can see student notices
  if (userRole === 'student') return audiences.includes('students');
  
  // Parents can see parent notices
  if (userRole === 'parent') return audiences.includes('parents');
  
  return false;
}
