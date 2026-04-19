import { X, Send, Calendar, Users, FileText, Pin, Tag } from 'lucide-react';
import { Notice } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

interface NoticeDetailModalProps {
  notice: Notice;
  onClose: () => void;
  onDeleted?: () => void;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  user_role?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export function NoticeDetailModal({ notice, onClose, onDeleted }: NoticeDetailModalProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // All authenticated users can comment
  const canComment = !!user;
  // Only admin and faculty can reply to comments
  const canReply = user?.role === 'admin' || user?.role === 'faculty';
  const canDelete = user?.role === 'admin';

  useEffect(() => {
    fetchCommentsAndAttachments();
  }, [notice.id]);

  const fetchCommentsAndAttachments = async () => {
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('notice_comments')
        .select('*')
        .eq('notice_id', notice.id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('notice_attachments')
        .select('*')
        .eq('notice_id', notice.id);

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canComment || !commentText.trim() || !user) return;

    try {
      console.log('Submitting comment with user:', { user_id: user.id, user_name: user.name, notice_id: notice.id });
      console.log('Comment data:', { notice_id: notice.id, user_id: user.id, content: commentText });
      
      // Build comment data - only include user_role if available
      const commentData: any = {
        notice_id: notice.id,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar || null,
        content: commentText.trim(),
      };

      // Try to include user_role if the column exists
      if (user.role) {
        commentData.user_role = user.role;
      }

      const { error, data } = await supabase.from('notice_comments').insert(commentData);

      if (error) {
        console.error('Full error object:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // If error is about user_role column, try again without it
        if (error.message?.includes('user_role')) {
          console.log('user_role column not found, retrying without it...');
          delete commentData.user_role;
          const { error: retryError } = await supabase.from('notice_comments').insert(commentData);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      console.log('Comment inserted successfully:', data);
      setCommentText('');
      fetchCommentsAndAttachments();
      toast({
        title: 'Comment Posted',
        description: 'Your comment has been added successfully',
      });
    } catch (error: any) {
      console.error('Comment submission error:', error);
      console.error('Error full details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReplyComment = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!canReply || !replyText.trim() || !user) return;

    try {
      console.log('Submitting reply:', { notice_id: notice.id, parent_id: parentCommentId, content: replyText });
      
      // Build reply data - try with parent_comment_id first
      let replyData: any = {
        notice_id: notice.id,
        parent_comment_id: parentCommentId,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar || null,
        content: replyText.trim(),
      };

      // Try to include user_role if available
      if (user.role) {
        replyData.user_role = user.role;
      }

      let { error } = await supabase.from('notice_comments').insert(replyData);

      // If error mentions parent_comment_id column not found, retry without it
      if (error?.message?.includes('parent_comment_id')) {
        console.log('parent_comment_id column not found, retrying without it...');
        replyData = {
          notice_id: notice.id,
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.avatar || null,
          content: `[Reply to comment] ${replyText.trim()}`,
        };
        if (user.role) {
          replyData.user_role = user.role;
        }
        const result = await supabase.from('notice_comments').insert(replyData);
        error = result.error;
      }

      // If error mentions user_role column not found, try again without it
      if (error?.message?.includes('user_role')) {
        console.log('user_role column not found, retrying without it...');
        delete replyData.user_role;
        const result = await supabase.from('notice_comments').insert(replyData);
        error = result.error;
      }

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      fetchCommentsAndAttachments();
      toast({
        title: 'Reply Posted',
        description: 'Your reply has been added successfully',
      });
    } catch (error: any) {
      console.error('Reply submission error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotice = async () => {
    if (!canDelete) return;

    const confirmed = window.confirm('Delete this notice permanently?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('notices').delete().eq('id', notice.id);
      if (error) throw error;

      toast({
        title: 'Notice Deleted',
        description: 'The notice has been removed successfully',
      });

      onDeleted?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-start justify-between p-6">
            <div className="flex-1 pr-8">
              {/* Category and Priority Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryColor(
                    notice.category || 'General'
                  )}`}
                >
                  <Tag className="h-3 w-3" />
                  {notice.category || 'General'}
                </span>
                {notice.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-semibold">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </span>
                )}
                {notice.priority === 'urgent' && (
                  <span className="rounded-full bg-red-100 text-red-700 border border-red-200 px-3 py-1 text-xs font-semibold">
                    Urgent
                  </span>
                )}
                {notice.priority === 'high' && (
                  <span className="rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 text-xs font-semibold">
                    High Priority
                  </span>
                )}
              </div>

              <h2 className="mb-3 text-2xl font-bold text-slate-900">
                {notice.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {notice.author_name}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(notice.created_at), 'MMM dd, yyyy - h:mm a')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button variant="destructive" size="sm" onClick={handleDeleteNotice}>
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Audience Tags */}
          <div className="mb-6 flex flex-wrap gap-2">
            {notice.audiences.map((audience) => (
              <Badge key={audience} variant="secondary" className="capitalize">
                {audience}
              </Badge>
            ))}
            {notice.email_notification && (
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Email Notification Sent
              </Badge>
            )}
            {notice.expiry_date && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Expires: {format(new Date(notice.expiry_date), 'MMM dd, yyyy')}
              </Badge>
            )}
          </div>

          {/* Notice Content */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
              {notice.content}
            </p>
          </div>

          {/* Attachments */}
          {!loading && attachments.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-slate-900 text-lg">Attachments</h3>
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-blue-300 hover:shadow-md"
                >
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {attachment.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            {canComment && user ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full border-2 border-blue-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {user.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts or questions..."
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!commentText.trim()}
                        className="shadow-md"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-center text-sm text-blue-700">
                <p>Please log in to comment on this notice.</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-sm text-slate-600 py-8">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-slate-600 py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        className="h-10 w-10 rounded-full border-2 border-blue-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {comment.user_name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-900">
                            {comment.user_name}
                            {comment.user_role && (
                              <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                                {comment.user_role}
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-slate-700">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-600">
                          {format(new Date(comment.created_at), 'MMM dd, yyyy - h:mm a')}
                        </p>
                        {canReply && (
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                      </div>
                      
                      {/* Reply Form */}
                      {replyingTo === comment.id && canReply && user && (
                        <form onSubmit={(e) => handleReplyComment(e, comment.id)} className="mt-3 ml-4 pl-4 border-l-2 border-blue-200">
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 resize-none rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={2}
                            />
                          </div>
                          <div className="mt-2 flex gap-2 justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!replyText.trim()}
                            >
                              <Send className="mr-1 h-3 w-3" />
                              Reply
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
