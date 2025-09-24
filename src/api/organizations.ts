import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface Organization {
  id: number;
  name: string;
  team_number: number;
}

export const organizationsQueryKey = ['organizations'] as const;

export const fetchOrganizations = () => apiFetch<Organization[]>('admin/organizations');

export const useOrganizations = () =>
  useQuery<Organization[]>({
    queryKey: organizationsQueryKey,
    queryFn: fetchOrganizations,
  });
