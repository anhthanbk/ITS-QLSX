import { supabase } from '@/lib/supabase/client';
import type { Profile, UserRole } from '../types';

/**
 * Fetches the user profile by ID with explicit column selection.
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      employee_id,
      full_name,
      avatar_url,
      phone,
      status,
      date_of_birth,
      id_card_number,
      department_id,
      position_id,
      temp_employee_code,
      rejection_reason,
      created_at,
      departments:department_id(id, name, code),
      positions:position_id(id, title, code)
    `,
    )
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

/**
 * Updates user personal profile information with explicit column selection.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    full_name: string;
    phone?: string | null;
    date_of_birth?: string | null;
    id_card_number?: string | null;
    avatar_url?: string | null;
  },
): Promise<Profile> {
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || null,
      date_of_birth: data.date_of_birth || null,
      id_card_number: data.id_card_number?.trim() || null,
      avatar_url: data.avatar_url ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(
      `
      id,
      employee_id,
      full_name,
      avatar_url,
      phone,
      status,
      date_of_birth,
      id_card_number,
      department_id,
      position_id,
      temp_employee_code,
      rejection_reason,
      created_at,
      departments:department_id(id, name, code),
      positions:position_id(id, title, code)
    `,
    )
    .single();

  if (error) {
    console.error('Failed to update user profile:', error);
    throw new Error(error.message);
  }

  return updated as unknown as Profile;
}

/**
 * Updates the authenticated user's password via Supabase Auth.
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword.trim(),
  });

  if (error) {
    console.error('Failed to update user password:', error);
    throw new Error(error.message);
  }
}

/**
 * Uploads an avatar image to the public 'avatars' bucket and returns its public URL.
 */
export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
  // Validate file size (<= 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Kích thước ảnh đại diện không được vượt quá 5MB.');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `users/${userId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Failed to upload avatar:', uploadError);
    throw new Error(`Tải ảnh thất bại: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export interface ResubmitRegistrationParams {
  fullName: string;
  dateOfBirth?: string | null;
  idCardNumber?: string | null;
  phone?: string | null;
  departmentId: string;
  positionId: string;
  avatarUrl?: string | null;
}

/**
 * Resubmits a rejected candidate registration for review after updating personal details.
 */
export async function resubmitRejectedRegistration(
  params: ResubmitRegistrationParams,
): Promise<{ success: boolean; temp_employee_code: string; status: string }> {
  const { data, error } = await supabase.rpc('resubmit_rejected_registration', {
    p_full_name: params.fullName.trim(),
    p_date_of_birth: params.dateOfBirth || '',
    p_id_card_number: params.idCardNumber?.trim() || '',
    p_phone: params.phone?.trim() || '',
    p_department_id: params.departmentId,
    p_position_id: params.positionId,
    p_avatar_url: params.avatarUrl || undefined,
  });

  if (error) {
    console.error('Failed to resubmit registration:', error);
    throw new Error(error.message);
  }

  return data as unknown as { success: boolean; temp_employee_code: string; status: string };
}


