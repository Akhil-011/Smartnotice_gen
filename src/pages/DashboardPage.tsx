import { useEffect, useState } from 'react';
import { Plus, Filter, Search, Edit, Trash2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useAuthStore } from '../stores/authStore';
import { Header } from '../components/layout/Header';
import { NoticeCard } from '../components/features/NoticeCard';
import { NoticeDetailModal } from '../components/features/NoticeDetailModal';
import { CreateNoticeModal } from '../components/features/CreateNoticeModal';
import { Button } from '../components/ui/button';
import { Notice } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const canCreateNotice = user?.role === 'admin';
  const canUpdateNotice = user?.role === 'admin' || user?.role === 'faculty';
  const canDeleteNotice = user?.role === 'admin';

  useEffect(() => {
    fetchNotices();

    // Subscribe to real-time notice changes
    const channel = supabase
      .channel('notices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices',
        },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    const confirmed = window.confirm('Delete this notice permanently?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('notices').delete().eq('id', noticeId);
      if (error) throw error;

      setNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
      toast({
        title: 'Notice Deleted',
        description: 'The notice has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notice',
        variant: 'destructive',
      });
    }
  };

  const displayNotices = notices.filter((notice) => {
    // Filter out expired notices
    const now = new Date();
    if (notice.expiry_date && new Date(notice.expiry_date) < now) {
      return false;
    }

    // All authenticated users see all notices (no role-based filtering)
    // Category filter
    const categoryMatch = categoryFilter === 'all' || notice.category === categoryFilter;

    // Search filter (title and content)
    const searchMatch = searchQuery === '' || 
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      faculty: 'Faculty Member',
      student: 'Student',
      parent: 'Parent',
    };
    return roleNames[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Notice Board</h1>
              <p className="text-slate-600 text-lg">
                Welcome, <span className="font-semibold text-blue-600">{user?.name}</span> (
                {getRoleName(user?.role || '')})
              </p>
            </div>
            {canCreateNotice && (
              <Button
                onClick={() => {
                  setEditingNotice(null);
                  setIsCreateModalOpen(true);
                }}
                size="lg"
                className="shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Notice
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search notices by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-base shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-700">
              <Filter className="h-4 w-4" />
              <span className="font-semibold">Filter by Category:</span>
            </div>
            {['all', 'General', 'Academic', 'Events', 'Exams', 'Urgent'].map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className={categoryFilter === cat ? 'shadow-md' : ''}
              >
                {cat === 'all' ? 'All' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Notices Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-white/50 shadow-md"
              ></div>
            ))}
          </div>
        ) : displayNotices.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-16 text-center shadow-md">
            <p className="text-slate-600 text-lg">
              {categoryFilter === 'all'
                ? 'No notices available at the moment.'
                : `No notices in ${categoryFilter} category.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayNotices.map((notice) => (
              <div key={notice.id} className="relative group">
                <NoticeCard
                  notice={notice}
                  onViewDetails={() => {
                    setSelectedNotice(notice);
                    setIsDetailModalOpen(true);
                  }}
                />
                {canUpdateNotice && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingNotice(notice);
                        setIsCreateModalOpen(true);
                      }}
                      className="shadow-md bg-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {canDeleteNotice && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="shadow-md"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateNoticeModal
          notice={editingNotice}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingNotice(null);
          }}
          onSuccess={fetchNotices}
        />
      )}

      {isDetailModalOpen && selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedNotice(null);
          }}
          onDeleted={() => {
            setIsDetailModalOpen(false);
            setSelectedNotice(null);
            fetchNotices();
          }}
        />
      )}
    </div>
  );
}
