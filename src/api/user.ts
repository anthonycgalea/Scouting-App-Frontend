import { apiFetch } from './httpClient';

export interface UserInfoResponse {
  id: string | number;
  email?: string;
  full_name?: string;
  display_name?: string;
  name?: string;
  username?: string;
  user_name?: string;
}

export const fetchUserInfo = () => apiFetch<UserInfoResponse>('user/info');
