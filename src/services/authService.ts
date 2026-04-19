import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

export class AuthService {
  // Map Supabase user to app user
  mapUser(user: SupabaseUser, profile?: any): User {
    return {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email!.split('@')[0],
      role: profile?.role || user.user_metadata?.role || 'student',
      avatar: profile?.avatar || user.user_metadata?.avatar_url,
      department: profile?.department || user.user_metadata?.department,
    };
  }

  // Sign up with automatic login (no email confirmation required)
  async signUp(
    email: string,
    password: string,
    name: string,
    role: string,
    department: string | null
  ): Promise<{ user: User; needsEmailVerification: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Attempting to sign up:', normalizedEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name,
          role,
          department,
        },
      },
    });
    
    if (error) {
      console.error('Signup Error:', error);
      
      // Better error messages
      const message = error.message?.toLowerCase() || '';
      
      if (message.includes('already registered') || message.includes('user already exists')) {
        throw new Error('This email is already registered. Please log in with your existing account.');
      }
      
      if (message.includes('weak password')) {
        throw new Error('Password is too weak. Use at least 8 characters with mixed case and numbers.');
      }
      
      if (message.includes('invalid email')) {
        throw new Error('Invalid email address. Please check and try again.');
      }
      
      throw new Error(error.message || 'Failed to create account');
    }
    
    if (!data.user) {
      console.error('No user returned from signup');
      throw new Error('Failed to create user account');
    }
    
    console.log('User created successfully:', data);
    
    // If no session is returned, email confirmation is enabled.
    // In this case, inserting into profiles from client fails RLS because auth.uid() is null.
    if (!data.session) {
      console.log('Email confirmation required - returning without profile creation');
      return {
        user: this.mapUser(data.user, {
          name,
          email: normalizedEmail,
          role,
          department: department || null,
        }),
        needsEmailVerification: true,
      };
    }

    console.log('Session exists - creating profile');
    // Create or update profile in database
    // Only include department if it has a value (null for students/parents)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email: normalizedEmail,
      role,
      department: department || null,
    }, { onConflict: 'id' });
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create user profile: ' + profileError.message);
    }
    
    console.log('Profile created - fetching profile data');
    // Fetch the created profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
      throw new Error('Failed to fetch user profile: ' + fetchError.message);
    }
    
    console.log('Signup complete - returning user with profile');
    // Return user with profile data
    return {
      user: this.mapUser(data.user, profile),
      needsEmailVerification: false,
    };
  }

  // Sign in with password - returns immediately without fetching profile
  // Profile is fetched by auth listener in the background
  async signInWithPassword(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. If you just created an account, verify your email first and then login.');
      }

      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email not verified yet. Please verify your email and then login.');
      }

      throw new Error(error.message);
    }

    // Try to create profile if it doesn't exist (handles email verification signup flow)
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existingProfile && data.user.user_metadata) {
        console.log('Creating profile for verified user:', data.user.id);
        await supabase.from('profiles').insert({
          id: data.user.id,
          name: data.user.user_metadata.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: data.user.user_metadata.role || 'student',
          department: data.user.user_metadata.department || null,
        });
      }
    } catch (profileError) {
      console.error('Profile creation during login failed (non-blocking):', profileError);
      // Don't fail login if profile creation fails - they can still log in
    }

    // Return user immediately without waiting for profile fetch
    // The auth state listener will fetch the full profile in the background
    return this.mapUser(data.user, {
      name: data.user.user_metadata?.name,
      role: data.user.user_metadata?.role || 'student',
    });
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  // Get current session
  async getSession() {
    console.log('Getting session from Supabase...');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      throw error;
    }
    console.log('Session result:', session ? `User ${session.user.id}` : 'No session');
    return session;
  }

  // Get current user with profile
  async getCurrentUser() {
    try {
      console.log('getCurrentUser called');
      const session = await this.getSession();
      if (!session?.user) {
        console.log('No session, checking stored user...');
        return null;
      }

      console.log('Session user email:', session.user.email);
      console.log('Fetching profile for user:', session.user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        console.log('Falling back to metadata-based user');
        // Return user with metadata even if profile fetch fails
        const user = this.mapUser(session.user);
        console.log('Returning user from metadata:', user.id, user.name, user.role);
        return user;
      }

      if (!profile) {
        console.log('No profile found for user, using metadata:', session.user.id);
        const user = this.mapUser(session.user);
        console.log('Returning user from metadata:', user.id, user.name, user.role);
        return user;
      }

      console.log('Profile found for user:', profile.id);
      const user = this.mapUser(session.user, profile);
      console.log('Returning full user:', user.id, user.name, user.role);
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
