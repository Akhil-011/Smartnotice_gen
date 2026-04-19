import { useState, useEffect } from 'react';
import { Clock, User, Tag, Eye, MessageCircle, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { Notice } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';

interface NoticeCardProps {
  notice: Notice;
  onViewDetails: () => void;
}

export function NoticeCard({ notice, onViewDetails }: NoticeCardProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [notice.id]);

  const fetchComments = async () => {
    const { count, error } = await supabase
      .from('notice_comments')
      .select('*', { count: 'exact', head: true })
      .eq('notice_id', notice.id);

    if (!error) {
      setCommentsCount(count || 0);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Academic: 'bg-blue-100 text-blue-700 border-blue-200',
      Events: 'bg-purple-100 text-purple-700 border-purple-200',
      Exams: 'bg-red-100 text-red-700 border-red-200',
      Urgent: 'bg-orange-100 text-orange-700 border-orange-200',
      General: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[category] || colors.General;
  };

  const getAudienceLabel = (audiences: string[]) => {
    if (audiences.includes('guests')) return 'Public';
    if (audiences.includes('faculty')) return 'Faculty';
    if (audiences.includes('students')) return 'Students';
    if (audiences.includes('parents')) return 'Parents';
    return 'All';
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl hover:border-blue-300 bg-white">
      <div className="p-6">
        {/* Header with Category and Pin */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryColor(
                notice.category || 'General'
              )}`}
            >
              <Tag className="h-3 w-3" />
              {notice.category || 'General'}
            </span>
            {notice.priority === 'urgent' && (
              <span className="inline-block rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                Urgent
              </span>
            )}
          </div>
          {notice.is_pinned && (
            <div className="flex items-center gap-1 text-amber-600">
              <Pin className="h-4 w-4" />
              <span className="text-xs font-semibold">Pinned</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {notice.title}
        </h3>

        {/* Content Preview */}
        <p className="mb-4 text-slate-600 line-clamp-3 leading-relaxed">
          {notice.content}
        </p>

        {/* Metadata */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="font-medium">{notice.author_name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(notice.created_at), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
              {getAudienceLabel(notice.audiences)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-slate-600 hover:bg-slate-50 hover:text-blue-600"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            <span className="font-semibold">
              {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
