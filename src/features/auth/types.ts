import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  employee_id: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  status: string;
}

export interface UserRole {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: UserRole[];
  permissions: string[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    roleCode?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
}
