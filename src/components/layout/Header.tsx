import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';

export function Header() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white shadow-soft">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Smart Notice Board</h1>
            <p className="text-xs text-muted-foreground">Digital Campus Notices</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 md:flex">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-9 w-9 rounded-full border-2 border-primary-200"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <User className="h-4 w-4" />
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
