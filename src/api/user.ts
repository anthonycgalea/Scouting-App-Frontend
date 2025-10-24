import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
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

export const useUserInfo = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<UserInfoResponse>({
    queryKey: userInfoQueryKey,
    queryFn: fetchUserInfo,
    enabled,
  });

export const updateUserOrganization = (userOrganizationId: number | null) =>
  apiFetch<void>('user/organization', {
    method: 'PATCH',
    json: { user_organization_id: userOrganizationId },
  });

export const userRoleQueryKey = ['user', 'role'] as const;
export const userOrganizationQueryKey = ['user', 'organization'] as const;

const AUTHENTICATION_QUERY_KEYS = [
  userInfoQueryKey,
  userRoleQueryKey,
  userOrganizationQueryKey,
] as const satisfies readonly QueryKey[];

const areQueryKeysEqual = (target: readonly unknown[], candidate: readonly unknown[]) =>
  target.length === candidate.length && target.every((value, index) => candidate[index] === value);

const isAuthenticationQueryKey = (queryKey: QueryKey) =>
  AUTHENTICATION_QUERY_KEYS.some((authKey) => areQueryKeysEqual(authKey, queryKey));

export const useUpdateUserOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserOrganization,
    onSuccess: async () => {
      await queryClient.cancelQueries({
        predicate: (query) => !isAuthenticationQueryKey(query.queryKey),
      });

      queryClient.removeQueries({
        predicate: (query) => !isAuthenticationQueryKey(query.queryKey),
      });

      await Promise.all(
        AUTHENTICATION_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      );
    },
  });
};

export const updateUserDisplayName = (displayName: string) =>
  apiFetch<void>('user/info', {
    method: 'PATCH',
    json: { display_name: displayName },
  });

export const useUpdateUserDisplayName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserDisplayName,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userInfoQueryKey });
      await queryClient.refetchQueries({ queryKey: userInfoQueryKey });
    },
  });
};

export interface UserRoleResponse {
  role: string | null;
  isSiteAdmin?: boolean;
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
  team_number?: number | null;
  teamNumber?: number | null;
}

export const fetchUserOrganization = () =>
  apiFetch<UserOrganizationResponse>('user/organization');

export const useUserOrganization = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<UserOrganizationResponse>({
    queryKey: userOrganizationQueryKey,
    queryFn: fetchUserOrganization,
    enabled,
  });
