'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  onboarded: boolean;
  weeklyStudyHours: number;
  targetGoalId?: string | null;
  yearOfStudy?: number | null;
  branch?: string | null;
}

export function useUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pathpilot_demo_authenticated');
        window.location.reload();
      }
    }
  }, []);

  return { user, loading, refetch: fetchUser, logout, setUser };
}
