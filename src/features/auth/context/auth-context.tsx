import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { fetchUserProfile, fetchUserRolesAndPermissions } from '../api/auth-api';
import type { AuthContextValue, AuthUser, SignUpParams } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setSupabaseUser(null);
      setIsLoading(false);
      return;
    }

    const sbUser = currentSession.user;
    setSupabaseUser(sbUser);

    try {
      const [profile, { roles, permissions }] = await Promise.all([
        fetchUserProfile(sbUser.id),
        fetchUserRolesAndPermissions(sbUser.id),
      ]);

      setUser({
        id: sbUser.id,
        email: sbUser.email ?? '',
        profile,
        roles,
        permissions,
      });
    } catch (err) {
      console.error('Error loading user profile & permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      void loadUserData(initialSession);
    });

    // 2. Listen to session and auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      void loadUserData(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    return { error: null };
  }, []);

  const signUp = useCallback(
    async (params: SignUpParams) => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            avatar_url: params.avatarUrl || null,
            date_of_birth: params.dateOfBirth,
            phone: params.phone || null,
            id_card_number: params.idCardNumber || null,
            department_id: params.departmentId,
            position_id: params.positionId,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { error };
      }

      // If auto-confirmed or session established immediately
      if (data.session) {
        setSession(data.session);
        await loadUserData(data.session);
      } else {
        setIsLoading(false);
      }

      return { error: null };
    },
    [loadUserData],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setSupabaseUser(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await loadUserData(session);
  }, [loadUserData, session]);

  const hasPermission = useCallback(
    (permissionCode: string) => {
      if (!user) return false;
      // Admin has access to everything
      if (user.roles.some((r) => r.code === 'admin')) return true;
      return user.permissions.includes(permissionCode);
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissionCodes: string[]) => {
      if (!user) return false;
      if (user.roles.some((r) => r.code === 'admin')) return true;
      return permissionCodes.some((code) => user.permissions.includes(code));
    },
    [user],
  );

  const hasRole = useCallback(
    (roleCode: string) => {
      if (!user) return false;
      return user.roles.some((r) => r.code === roleCode);
    },
    [user],
  );

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      supabaseUser,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      hasPermission,
      hasAnyPermission,
      hasRole,
    }),
    [
      user,
      supabaseUser,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      hasPermission,
      hasAnyPermission,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export { AuthContext };
