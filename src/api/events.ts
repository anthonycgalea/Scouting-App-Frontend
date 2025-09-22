import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface EventSummary {
  event_key: string;
  event_name: string;
  short_name: string;
  year: number;
  week: number;
}

export const eventsQueryKey = (year: number) => ['events', year] as const;

export const fetchEvents = (year: number) => apiFetch<EventSummary[]>(`events/${year}`);

export const useEvents = (year: number) =>
  useQuery<EventSummary[]>({
    queryKey: eventsQueryKey(year),
    queryFn: () => fetchEvents(year),
  });
