import { useState } from 'react';
import { Bell, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface SignupPageProps {
  onBack: () => void;
}

export function SignupPage({ onBack }: SignupPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');

  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup form submitted');
    
    // Validation
    const requiresDepartment = role === 'admin' || role === 'faculty';
    if (!name.trim() || !email.trim() || !password || !role || (requiresDepartment && !department)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting signup with:', { name, email, role });

    try {
      // Only pass department for admin/faculty (null for students/parents)
      const finalDepartment = (role === 'admin' || role === 'faculty') ? department : null;
      console.log('Calling authService.signUp');
      const result = await authService.signUp(email, password, name, role, finalDepartment);
      console.log('Signup result:', result);

      if (result.needsEmailVerification) {
        console.log('Email verification needed, redirecting to login');
        toast({
          title: 'Account Created',
          description: 'Please verify your email, then log in.',
        });
        onBack();
        return;
      }

      // Auto-login only when session exists immediately.
      console.log('Logging in user automatically');
      login(result.user);
      console.log('User logged in');

      toast({
        title: 'Account Created Successfully! 🎉',
        description: `Welcome ${name}! You're now logged in.`,
      });
      setIsLoading(false);
    } catch (error: any) {
      console.error('Signup error caught:', error);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      const isAlreadyRegistered = error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists');
      
      if (isAlreadyRegistered) {
        toast({
          title: 'Account Already Exists',
          description: 'This email is already registered. Please log in.',
          variant: 'destructive',
        });
        // Show "Back to Login" button
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      }
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
            Join Your Campus Community
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-primary-50">
            Create your account to stay connected with campus announcements, events,
            and important updates in real-time.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <CheckCircle className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-sm text-primary-100">
                  Access notices relevant to your role in the institution
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <CheckCircle className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold">Email Notifications</h3>
                <p className="text-sm text-primary-100">
                  Get notified when important notices are posted
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-white/20 p-1.5">
                <CheckCircle className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold">Interactive Features</h3>
                <p className="text-sm text-primary-100">
                  Comment and react to notices to engage with the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
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
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-sm text-muted-foreground">
                Fill in your details to get started
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={role} 
                  onValueChange={(value) => {
                    setRole(value);
                    // Clear department when switching to student/parent
                    if (value === 'student' || value === 'parent') {
                      setDepartment('');
                    }
                  }} 
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department field - only visible for Admin and Faculty */}
              {(role === 'admin' || role === 'faculty') && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="CSE">CSE (All Integrated Branches)</SelectItem>
                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                      <SelectItem value="MECH">MECH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  'Creating Account...'
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create Account & Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={onBack}
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
