import { useState } from 'react';
import { Bell, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { authService } from '../services/authService';

interface LoginPageProps {
  onSignupClick: () => void;
}

export function LoginPage({ onSignupClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Login attempt with email:', email);

    try {
      console.log('Calling signInWithPassword...');
      const user = await authService.signInWithPassword(email, password);
      console.log('Sign in successful, user:', user.id);
      console.log('Calling login() to set auth store...');
      login(user);
      console.log('User logged in and store updated, showing toast');
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${user.name}`,
      });
    } catch (error: any) {
      console.error('Login error:', error.message, error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center max-w-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Notice Board</h1>
              <p className="text-primary-100">Digital Campus Communication</p>
            </div>
          </div>
          
          <h2 className="mb-4 text-4xl font-bold leading-tight">
            Stay Connected with Your Campus
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-primary-50">
            Real-time notice updates, role-based access, and centralized communication
            for educational institutions. Never miss an important announcement again.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <div className="h-2 w-2 rounded-full bg-accent-400"></div>
              </div>
              <div>
                <h3 className="font-semibold">Real-Time Updates</h3>
                <p className="text-sm text-primary-100">
                  Get instant notifications when new notices are posted
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <div className="h-2 w-2 rounded-full bg-accent-400"></div>
              </div>
              <div>
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-sm text-primary-100">
                  See only the notices relevant to your role
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <div className="h-2 w-2 rounded-full bg-accent-400"></div>
              </div>
              <div>
                <h3 className="font-semibold">Engage & Interact</h3>
                <p className="text-sm text-primary-100">
                  React and comment on notices to stay engaged
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-medium">
              <Bell className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Smart Notice Board</h1>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-strong">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access your campus notices
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={onSignupClick}
                className="text-sm"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
