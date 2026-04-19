import { create } from 'zustand';
import { Notice, NoticeAudience, Reaction, Comment } from '../types';

interface NoticeState {
  notices: Notice[];
  addNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>) => void;
  updateNotice: (id: string, updates: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;
  togglePin: (id: string) => void;
  addReaction: (noticeId: string, userId: string, userName: string, type: Reaction['type']) => void;
  removeReaction: (noticeId: string, userId: string) => void;
  addComment: (noticeId: string, userId: string, userName: string, userAvatar: string | undefined, content: string) => void;
}

// Mock notices for V1.0
const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Mid-Semester Examination Schedule Released',
    content: 'The mid-semester examination schedule for all departments has been released. Exams will begin from March 15, 2025. Students are requested to check their respective department notice boards for detailed timetables. All exams will be conducted in offline mode. Please carry your ID cards and admit cards to the examination hall.',
    createdAt: new Date('2025-12-29'),
    updatedAt: new Date('2025-12-29'),
    author: { id: '1', name: 'Examination Cell' },
    audiences: ['students', 'parents'],
    isPinned: true,
    priority: 'urgent',
    attachments: [
      { id: 'a1', name: 'exam_schedule.pdf', url: '#', size: 245000, type: 'application/pdf' },
    ],
    reactions: [
      { id: 'r1', userId: '2', userName: 'John Student', type: 'important', createdAt: new Date() },
    ],
    comments: [],
    emailNotification: true,
  },
  {
    id: '2',
    title: 'Annual Cultural Fest - Technova 2025',
    content: 'We are excited to announce our annual cultural fest "Technova 2025" scheduled for April 5-7, 2025. Registration for various events including music, dance, drama, and technical competitions is now open. Prize pool worth ₹5 lakhs. Don\'t miss this opportunity to showcase your talent!',
    createdAt: new Date('2025-12-28'),
    updatedAt: new Date('2025-12-28'),
    author: { id: '1', name: 'Cultural Committee' },
    audiences: ['students', 'staff'],
    isPinned: true,
    priority: 'important',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'],
    reactions: [
      { id: 'r2', userId: '2', userName: 'John Student', type: 'love', createdAt: new Date() },
    ],
    comments: [
      {
        id: 'c1',
        userId: '2',
        userName: 'John Student',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        content: 'Excited for this! When does registration close?',
        createdAt: new Date('2025-12-28'),
      },
    ],
    emailNotification: false,
  },
  {
    id: '3',
    title: 'Library Timing Extension During Exam Period',
    content: 'Considering the upcoming mid-semester exams, the central library will extend its operating hours. From March 10-25, 2025, the library will remain open from 7:00 AM to 11:00 PM. Students can access all reading rooms and digital resources during these hours.',
    createdAt: new Date('2025-12-27'),
    updatedAt: new Date('2025-12-27'),
    author: { id: '1', name: 'Library Administration' },
    audiences: ['students', 'staff'],
    isPinned: false,
    priority: 'normal',
    reactions: [
      { id: 'r3', userId: '2', userName: 'John Student', type: 'helpful', createdAt: new Date() },
    ],
    comments: [],
    emailNotification: true,
  },
  {
    id: '4',
    title: 'Parent-Teacher Meeting - January 2025',
    content: 'A parent-teacher meeting has been scheduled for January 18, 2025, from 10:00 AM to 4:00 PM. Parents can meet with faculty members to discuss their ward\'s academic progress and attendance. Please bring your parent ID card for entry.',
    createdAt: new Date('2025-12-26'),
    updatedAt: new Date('2025-12-26'),
    author: { id: '1', name: 'Dean of Students' },
    audiences: ['parents'],
    isPinned: false,
    priority: 'important',
    reactions: [],
    comments: [],
    emailNotification: true,
  },
  {
    id: '5',
    title: 'Campus Placement Drive - Tech Giants',
    content: 'Leading tech companies including Google, Microsoft, and Amazon will be visiting our campus for placement drives in February 2025. Eligible students from CSE, IT, and ECE departments can register through the placement portal. Prepare your resumes and start practicing coding!',
    createdAt: new Date('2025-12-25'),
    updatedAt: new Date('2025-12-25'),
    author: { id: '1', name: 'Training & Placement Cell' },
    audiences: ['students'],
    isPinned: false,
    priority: 'important',
    images: ['https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop'],
    attachments: [
      { id: 'a2', name: 'placement_companies.pdf', url: '#', size: 189000, type: 'application/pdf' },
    ],
    reactions: [
      { id: 'r4', userId: '2', userName: 'John Student', type: 'important', createdAt: new Date() },
    ],
    comments: [],
    emailNotification: true,
  },
];

export const useNoticeStore = create<NoticeState>((set) => ({
  notices: mockNotices,
  
  addNotice: (noticeData) => {
    const newNotice: Notice = {
      ...noticeData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: [],
      comments: [],
    };
    
    set((state) => ({
      notices: [newNotice, ...state.notices],
    }));
  },
  
  updateNotice: (id, updates) => {
    set((state) => ({
      notices: state.notices.map((notice) =>
        notice.id === id
          ? { ...notice, ...updates, updatedAt: new Date() }
          : notice
      ),
    }));
  },
  
  deleteNotice: (id) => {
    set((state) => ({
      notices: state.notices.filter((notice) => notice.id !== id),
    }));
  },
  
  togglePin: (id) => {
    set((state) => ({
      notices: state.notices.map((notice) =>
        notice.id === id
          ? { ...notice, isPinned: !notice.isPinned }
          : notice
      ),
    }));
  },
  
  addReaction: (noticeId, userId, userName, type) => {
    set((state) => ({
      notices: state.notices.map((notice) => {
        if (notice.id === noticeId) {
          // Remove existing reaction from this user
          const filteredReactions = notice.reactions.filter((r) => r.userId !== userId);
          
          return {
            ...notice,
            reactions: [
              ...filteredReactions,
              { id: Date.now().toString(), userId, userName, type, createdAt: new Date() },
            ],
          };
        }
        return notice;
      }),
    }));
  },
  
  removeReaction: (noticeId, userId) => {
    set((state) => ({
      notices: state.notices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
              reactions: notice.reactions.filter((r) => r.userId !== userId),
            }
          : notice
      ),
    }));
  },
  
  addComment: (noticeId, userId, userName, userAvatar, content) => {
    set((state) => ({
      notices: state.notices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
              comments: [
                ...notice.comments,
                {
                  id: Date.now().toString(),
                  userId,
                  userName,
                  userAvatar,
                  content,
                  createdAt: new Date(),
                },
              ],
            }
          : notice
      ),
    }));
  },
}));
