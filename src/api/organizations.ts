import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface Organization {
  id: number;
  name: string;
  team_number: number;
  role: string;
  user_organization_id: number;
}

export const organizationsQueryKey = ['organizations'] as const;
export const allOrganizationsQueryKey = ['all-organizations'] as const;

export const fetchOrganizations = () => apiFetch<Organization[]>('user/organizations');
export const fetchAllOrganizations = () => apiFetch<Organization[]>('organizations');

export const applyToOrganization = (organizationId: number) =>
  apiFetch<void>('user/organization/apply', {
    method: 'POST',
    json: { organization_id: organizationId },
  });

export const useOrganizations = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery<Organization[]>({
    queryKey: organizationsQueryKey,
    queryFn: fetchOrganizations,
    enabled,
  });

export const useAllOrganizations = () =>
  useQuery<Organization[]>({
    queryKey: allOrganizationsQueryKey,
    queryFn: fetchAllOrganizations,
  });

export const useApplyToOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyToOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: allOrganizationsQueryKey });
    },
  });
};
