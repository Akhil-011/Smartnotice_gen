import { useState, useEffect } from 'react';
import { Bell, ArrowRight, Clock, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';
import { format } from 'date-fns';

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [publicNotices, setPublicNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicNotices();
  }, []);

  const fetchPublicNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .contains('audiences', ['guests'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setPublicNotices(data || []);
    } catch (error) {
      console.error('Error fetching public notices:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Smart Notice Board</h1>
              <p className="text-xs text-slate-600">Educational Institution</p>
            </div>
          </div>
          <Button onClick={onLoginClick} className="shadow-md">
            Login <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Digital Notice Board System
          </div>
          <h2 className="mb-6 text-5xl font-bold text-slate-900 leading-tight">
            Stay Connected with <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Campus Announcements
            </span>
          </h2>
          <p className="mb-8 text-xl text-slate-600 leading-relaxed">
            A centralized platform for real-time notices, announcements, and updates.
            Never miss important information from your educational institution.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={onLoginClick} size="lg" className="shadow-lg">
              Access Notice Board <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-8 text-center text-3xl font-bold text-slate-900">
            Why Smart Notice Board?
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-900">Real-Time Updates</h4>
              <p className="text-slate-600">
                Get instant notifications when new notices are published. Stay informed with live updates.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-900">Role-Based Access</h4>
              <p className="text-slate-600">
                View notices relevant to your role - Admin, Faculty, Students, or Parents.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-900">Organized & Clean</h4>
              <p className="text-slate-600">
                Categorized notices with clear visibility indicators for easy navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Notices Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold text-slate-900">Public Notices</h3>
              <p className="text-slate-600">Latest announcements for everyone</p>
            </div>
            <Button onClick={onLoginClick} variant="outline">
              View All Notices
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/50"></div>
              ))}
            </div>
          ) : publicNotices.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md border border-slate-200">
              <Bell className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-600">No public notices available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="group rounded-2xl bg-white p-6 shadow-md border border-slate-200 transition-all hover:shadow-xl hover:border-blue-300"
                >
                  {/* Category Badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryColor(
                        notice.category || 'General'
                      )}`}
                    >
                      {notice.category || 'General'}
                    </span>
                    {notice.is_pinned && (
                      <span className="text-xs text-amber-600 font-semibold">📌 Pinned</span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="mb-2 text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h4>

                  {/* Content Preview */}
                  <p className="mb-4 text-sm text-slate-600 line-clamp-3">
                    {notice.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(notice.created_at), 'MMM dd, yyyy')}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                      Public
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-slate-600">
          <p>© 2024 Smart Notice Board System. All rights reserved.</p>
          <p className="mt-2">Digital Campus Communication Platform</p>
        </div>
      </footer>
    </div>
  );
}
