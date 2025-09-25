import { useQuery } from '@tanstack/react-query';
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

export const useOrganizations = () =>
  useQuery<Organization[]>({
    queryKey: organizationsQueryKey,
    queryFn: fetchOrganizations,
  });

export const useAllOrganizations = () =>
  useQuery<Organization[]>({
    queryKey: allOrganizationsQueryKey,
    queryFn: fetchAllOrganizations,
  });
