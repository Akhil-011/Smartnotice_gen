import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

let initializeInFlight: Promise<void> | null = null;
let authListenerInitialized = false;

const clearPersistedAuth = () => {
  try {
    localStorage.removeItem('auth-storage');

    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-') || key.includes('supabase'))
      .forEach((key) => localStorage.removeItem(key));

    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('sb-') || key.includes('supabase'))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear persisted auth storage:', error);
  }
};

const setupAuthStateListener = () => {
  if (authListenerInitialized) return;

  authListenerInitialized = true;
  console.log('Setting up auth state listener');

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change event:', event);
    
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
      try {
        console.log('User session detected:', session.user.id);
        console.log('Calling getCurrentUser...');
        const user = await authService.getCurrentUser();
        console.log('getCurrentUser returned:', user ? `${user.id} (${user.name})` : 'null');
        
        if (user) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.id !== user.id) {
            console.log('User different from current, logging in:', user.id);
            useAuthStore.getState().login(user);
          } else {
            console.log('User already logged in, just clearing loading');
            useAuthStore.setState({ loading: false });
          }
        } else {
          console.log('No user returned, clearing loading');
          useAuthStore.setState({ loading: false });
        }
      } catch (error) {
        console.error('Failed to get user after sign in:', error);
        useAuthStore.setState({ loading: false });
      }
      return;
    }

    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      console.log('User signed out or deleted');
      clearPersistedAuth();
      useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
    }
  });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      login: (user: User) => {
        console.log('Setting user in auth store:', user.id);
        set({ user, isAuthenticated: true, loading: false });
      },
      logout: async () => {
        set({ loading: true, user: null, isAuthenticated: false });
        clearPersistedAuth();
        try {
          await authService.signOut();
        } catch (error) {
          console.error('Supabase sign out failed, clearing local auth anyway:', error);
        } finally {
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },
      initialize: async () => {
        console.log('Initializing auth store...');
        setupAuthStateListener();

        if (initializeInFlight) {
          console.log('Init already in flight, returning existing promise');
          return initializeInFlight;
        }

        initializeInFlight = (async () => {
          set({ loading: true });
          try {
            console.log('Attempting to get current user from Supabase');
            const user = await authService.getCurrentUser();
            console.log('Init: getCurrentUser returned:', user ? `${user.id} (${user.name})` : 'null');
            
            if (user) {
              console.log('User found, setting in store:', user.id);
              set({ user, isAuthenticated: true, loading: false });
            } else {
              console.log('No user found');
              set({ user: null, isAuthenticated: false, loading: false });
            }
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({ user: null, isAuthenticated: false, loading: false });
          } finally {
            initializeInFlight = null;
          }
        })();

        return initializeInFlight;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
