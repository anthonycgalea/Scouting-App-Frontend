import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface PrescoutRecord extends Record<string, unknown> {
  season: number;
  team_number: number;
  event_key: string;
  match_number: number;
  match_level: string;
  user_id: string | null;
  organization_id: number | null;
  timestamp: string;
  notes?: string | null;
}

export const eventPrescoutQueryKey = () => ['prescout', 'event'] as const;

export const fetchEventPrescoutRecords = () =>
  apiFetch<PrescoutRecord[]>('scout/prescout');

export const useEventPrescoutRecords = ({
  enabled,
}: { enabled?: boolean } = {}) => {
  const shouldEnable = enabled ?? true;

  return useQuery({
    queryKey: eventPrescoutQueryKey(),
    queryFn: fetchEventPrescoutRecords,
    enabled: shouldEnable,
  });
};
