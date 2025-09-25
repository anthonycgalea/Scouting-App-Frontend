import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

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

export interface UserRoleResponse {
  role: string | null;
}

export const fetchUserRole = () => apiFetch<UserRoleResponse>('user/role');

export const userRoleQueryKey = ['user', 'role'] as const;

export const useUserRole = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<UserRoleResponse>({
    queryKey: userRoleQueryKey,
    queryFn: fetchUserRole,
    enabled,
  });
