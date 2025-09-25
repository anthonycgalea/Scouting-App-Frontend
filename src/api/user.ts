import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface UserInfoResponse {
  id: string | number;
  email?: string;
  full_name?: string;
  display_name?: string;
  name?: string;
  username?: string;
  user_name?: string;
  userOrgId?: number | null;
  user_org_id?: number | null;
}

export const fetchUserInfo = () => apiFetch<UserInfoResponse>('user/info');

export const userInfoQueryKey = ['user', 'info'] as const;

export const useUserInfo = () =>
  useQuery<UserInfoResponse>({
    queryKey: userInfoQueryKey,
    queryFn: fetchUserInfo,
  });
