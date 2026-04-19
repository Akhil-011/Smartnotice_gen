import { useState, useEffect } from 'react';
import { X, Upload, Tag, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { Notice } from '../../types';

interface CreateNoticeModalProps {
  onClose: () => void;
  notice?: Notice | null;
  onSuccess?: () => void;
}

export function CreateNoticeModal({ onClose, notice, onSuccess }: CreateNoticeModalProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setCategory(notice.category || 'General');
      setPriority(notice.priority);
      setIsPinned(notice.is_pinned);
      setAudiences(notice.audiences);
      if (notice.expiry_date) {
        setExpiryDate(new Date(notice.expiry_date).toISOString().split('T')[0]);
      }
    }
  }, [notice]);

  const toggleAudience = (audience: string) => {
    setAudiences((prev) =>
      prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (audiences.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one audience',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const noticeData = {
        title,
        content,
        category,
        priority,
        is_pinned: isPinned,
        audiences,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        author_id: user!.id,
        author_name: user!.name,
      };

      if (notice) {
        // Update existing notice
        const { error } = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', notice.id);

        if (error) throw error;

        toast({
          title: 'Notice Updated',
          description: 'Your notice has been updated successfully',
        });
      } else {
        // Create new notice
        const { error } = await supabase.from('notices').insert([noticeData]);

        if (error) throw error;

        toast({
          title: 'Notice Published',
          description: `Your notice has been published to ${audiences.join(', ')}`,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save notice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {notice ? 'Edit Notice' : 'Create New Notice'}
              </h2>
              <p className="text-sm text-slate-600">
                Publish announcements to your campus community
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Notice Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Mid-Semester Examination Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Notice Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Enter the detailed notice content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Events">Events</SelectItem>
                <SelectItem value="Exams">Exams</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audience Selection */}
          <div className="space-y-3">
            <Label>
              Target Audience <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {['faculty', 'students', 'parents', 'guests'].map((audience) => (
                <label
                  key={audience}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                    audiences.includes(audience)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <Checkbox
                    checked={audiences.includes(audience)}
                    onCheckedChange={() => toggleAudience(audience)}
                  />
                  <span className="text-sm font-medium capitalize">{audience}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiry Date (Optional)
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-slate-600">
              Notice will be automatically hidden after this date
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox checked={isPinned} onCheckedChange={setIsPinned} />
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-900">Pin this notice</p>
                <p className="text-xs text-slate-600">
                  Pinned notices appear at the top of the feed
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 shadow-md" disabled={isLoading}>
              {isLoading ? 'Publishing...' : notice ? 'Update Notice' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
