import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface SuperScoutField {
  key: string;
  label: string;
}

export const superScoutFieldsQueryKey = () => ['super-scout-fields'] as const;

export const fetchSuperScoutFields = () =>
  apiFetch<SuperScoutField[]>('scout/superscout/fields');

export const useSuperScoutFields = () =>
  useQuery({
    queryKey: superScoutFieldsQueryKey(),
    queryFn: fetchSuperScoutFields,
  });

export interface SuperScoutStatus {
  eventCode: string;
  matchLevel: string;
  matchNumber: number;
  red: boolean;
  blue: boolean;
}

export const superScoutStatusesQueryKey = () => ['super-scout-statuses'] as const;

export const fetchSuperScoutStatuses = () =>
  apiFetch<SuperScoutStatus[]>('scout/superscouted');

export const useSuperScoutStatuses = () =>
  useQuery({
    queryKey: superScoutStatusesQueryKey(),
    queryFn: fetchSuperScoutStatuses,
  });
