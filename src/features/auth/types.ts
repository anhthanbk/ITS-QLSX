import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type ProfileStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface Profile {
  id: string;
  employee_id: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth?: string | null;
  id_card_number?: string | null;
  department_id?: string | null;
  position_id?: string | null;
  temp_employee_code?: string | null;
  status: ProfileStatus;
  rejection_reason?: string | null;
  created_at?: string;
  departments?: { id: string; name: string; code: string } | null;
  positions?: { id: string; title: string; code: string } | null;
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

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth: string;
  phone?: string;
  idCardNumber?: string;
  departmentId: string;
  positionId: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
}
