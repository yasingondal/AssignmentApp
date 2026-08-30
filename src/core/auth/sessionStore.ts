import { create } from 'zustand';
import { storage } from '@/core/storage/storage';

interface SessionState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearSession: () => void;
  hydrate: () => Promise<void>;
}

const SESSION_KEY = 'session';

export const useSessionStore = create<SessionState>((set) => ({
  token: 'mock-session-token',
  isAuthenticated: true,

  setToken: (token: string) => {
    set({ token, isAuthenticated: true });
    void storage.set(SESSION_KEY, { token });
  },

  clearSession: () => {
    set({ token: null, isAuthenticated: false });
    void storage.remove(SESSION_KEY);
  },

  hydrate: async () => {
    const session = await storage.get<{ token: string }>(SESSION_KEY);
    if (session?.token) {
      set({ token: session.token, isAuthenticated: true });
    }
  },
}));
