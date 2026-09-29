import { supabase } from '@/lib/supabase/client';
import type { Profile, UserRole } from '../types';

/**
 * Fetches the user profile by ID with explicit column selection.
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, employee_id, full_name, avatar_url, phone, status')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null;
    }
    console.error('Failed to fetch user profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Fetches the roles and permissions assigned to a user.
 */
export async function fetchUserRolesAndPermissions(userId: string): Promise<{
  roles: UserRole[];
  permissions: string[];
}> {
  // Query assigned roles
  const { data: userRolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_id, roles(id, code, name)')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Failed to fetch user roles:', rolesError);
  }

  const roles: UserRole[] = [];
  if (userRolesData) {
    for (const item of userRolesData) {
      if (item.roles) {
        roles.push(item.roles as unknown as UserRole);
      }
    }
  }

  // Query permissions via security definer RPC
  const { data: permData, error: permError } = await supabase.rpc('get_user_permissions', {
    p_user_id: userId,
  });

  const permissions: string[] = [];
  if (permError) {
    console.error('Failed to fetch user permissions:', permError);
  } else if (permData) {
    for (const row of permData) {
      if (row.permission_code && !permissions.includes(row.permission_code)) {
        permissions.push(row.permission_code);
      }
    }
  }

  return { roles, permissions };
}
