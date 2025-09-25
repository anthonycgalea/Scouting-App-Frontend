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
  week?: number | null;
  isPublic: boolean;
  isActive: boolean;
}

export interface UpdateOrganizationEventsRequestItem {
  eventKey: string;
  isPublic: boolean;
  isActive: boolean;
}

export type UpdateOrganizationEventsRequest = UpdateOrganizationEventsRequestItem[];

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

export const useOrganizationEvents = (
  organizationId: number | null | undefined,
  { enabled }: { enabled?: boolean } = {}
) => {
  const shouldEnable = (enabled ?? true) && organizationId != null;
  const queryKey =
    organizationId != null
      ? organizationEventsQueryKey(organizationId)
      : (['organization-events', 'unknown'] as const);

  return useQuery<OrganizationEventDetail[]>({
    queryKey,
    queryFn: () => {
      if (organizationId == null) {
        throw new Error('Organization ID is required to fetch organization events');
      }

      return fetchOrganizationEvents(organizationId);
    },
    enabled: shouldEnable,
  });
};

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

export const updateOrganizationEvents = (body: UpdateOrganizationEventsRequest) =>
  apiFetch<void>('organization/events', {
    method: 'PATCH',
    json: body,
  });

export interface UpdateOrganizationEventsVariables {
  organizationId: number;
  events: UpdateOrganizationEventsRequest;
}

export const useUpdateOrganizationEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ events }: UpdateOrganizationEventsVariables) =>
      updateOrganizationEvents(events),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationEventsQueryKey(variables.organizationId),
      });
    },
  });
};
