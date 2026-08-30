import React from 'react';
import { useEffect } from 'react';
import { useSessionStore } from '@/core/auth/sessionStore';
import { useToast } from '@/design-system/components/Toast';

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = useSessionStore.subscribe((state, prev) => {
      if (prev.isAuthenticated && !state.isAuthenticated) {
        toast.showWarning('Your session has expired. Please sign in again.');
      }
    });
    return unsubscribe;
  }, [toast]);

  return <>{children}</>;
}
