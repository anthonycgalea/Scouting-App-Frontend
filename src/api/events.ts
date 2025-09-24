import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, type JsonBody } from './httpClient';

export interface EventSummary {
  event_key: string;
  event_name: string;
  short_name: string;
  year: number;
  week: number;
}

export interface OrganizationEventDetail {
  eventKey: string;
  eventName: string;
  short_name?: string;
  isPublic: boolean;
  isActive: boolean;
}

export interface CreateOrganizationEventRequest {
  OrganizationId: number;
  EventKey: string;
}

export const eventsQueryKey = (year: number) => ['events', year] as const;

export const fetchEvents = (year: number) => apiFetch<EventSummary[]>(`events/${year}`);

export const useEvents = (year: number) =>
  useQuery<EventSummary[]>({
    queryKey: eventsQueryKey(year),
    queryFn: () => fetchEvents(year),
  });

export const eventInfoQueryKey = (eventCode: string) => ['event-info', eventCode] as const;

export const fetchEventInfo = (eventCode: string) =>
  apiFetch<EventSummary>(`event/${eventCode}/info`);

export const useEventInfo = (eventCode = '2025micmp4') =>
  useQuery<EventSummary>({
    queryKey: eventInfoQueryKey(eventCode),
    queryFn: () => fetchEventInfo(eventCode),
  });

export const organizationEventsQueryKey = (organizationId: number) =>
  ['organization-events', organizationId] as const;

export const fetchOrganizationEvents = (organizationId: number) =>
  apiFetch<OrganizationEventDetail[]>(`organization/${organizationId}/events`);

export const useOrganizationEvents = (organizationId: number) =>
  useQuery<OrganizationEventDetail[]>({
    queryKey: organizationEventsQueryKey(organizationId),
    queryFn: () => fetchOrganizationEvents(organizationId),
  });

export const createOrganizationEvent = (body: CreateOrganizationEventRequest) => {
  const payload: JsonBody = {
    OrganizationId: body.OrganizationId,
    EventKey: body.EventKey,
  };

  return apiFetch<void>('organization/createEvent', {
    method: 'POST',
    json: payload,
  });
};

export const useCreateOrganizationEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganizationEvent,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationEventsQueryKey(variables.OrganizationId),
      });
    },
  });
};
