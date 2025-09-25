import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './httpClient';
import { organizationsQueryKey } from './organizations';

export interface UserInfoResponse {
  id: string | number;
  email?: string;
  full_name?: string;
  display_name?: string;
  displayName?: string;
  name?: string;
  username?: string;
  user_name?: string;
  userOrgId?: number | null;
  user_org_id?: number | null;
  user_org?: {
    user_organization_id?: number | null;
  } | null;
}

export const fetchUserInfo = () => apiFetch<UserInfoResponse>('user/info');

export const userInfoQueryKey = ['user', 'info'] as const;

export const useUserInfo = () =>
  useQuery<UserInfoResponse>({
    queryKey: userInfoQueryKey,
    queryFn: fetchUserInfo,
  });

export const updateUserOrganization = (userOrganizationId: number | null) =>
  apiFetch<void>('user/organization', {
    method: 'PATCH',
    json: { user_organization_id: userOrganizationId },
  });

export const userRoleQueryKey = ['user', 'role'] as const;
export const userOrganizationQueryKey = ['user', 'organization'] as const;

export const useUpdateUserOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userInfoQueryKey });
      void queryClient.invalidateQueries({ queryKey: organizationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: userRoleQueryKey });
      void queryClient.invalidateQueries({ queryKey: userOrganizationQueryKey });
    },
  });
};

export interface UserRoleResponse {
  role: string | null;
}

export const fetchUserRole = () => apiFetch<UserRoleResponse>('user/role');

export const useUserRole = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<UserRoleResponse>({
    queryKey: userRoleQueryKey,
    queryFn: fetchUserRole,
    enabled,
  });

export interface UserOrganizationResponse {
  organization_id: number | null;
  organization_name: string | null;
}

export const fetchUserOrganization = () =>
  apiFetch<UserOrganizationResponse>('user/organization');

export const useUserOrganization = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<UserOrganizationResponse>({
    queryKey: userOrganizationQueryKey,
    queryFn: fetchUserOrganization,
    enabled,
  });
