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

export const fetchEventInfo = (_eventCode: string) => apiFetch<EventSummary>('event/info');

export const useEventInfo = (eventCode = '2025micmp4') =>
  useQuery<EventSummary>({
    queryKey: eventInfoQueryKey(eventCode),
    queryFn: () => fetchEventInfo(eventCode),
  });

export const organizationEventsQueryKey = () => ['organization-events'] as const;

export const fetchOrganizationEvents = () =>
  apiFetch<OrganizationEventDetail[]>('organization/events');

export const useOrganizationEvents = ({ enabled }: { enabled?: boolean } = {}) => {
  const shouldEnable = enabled ?? true;

  return useQuery<OrganizationEventDetail[]>({
    queryKey: organizationEventsQueryKey(),
    queryFn: fetchOrganizationEvents,
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationEventsQueryKey(),
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
  events: UpdateOrganizationEventsRequest;
}

export const useUpdateOrganizationEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ events }: UpdateOrganizationEventsVariables) =>
      updateOrganizationEvents(events),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationEventsQueryKey(),
      });
    },
  });
};

export interface EventTbaMatchDataRequest {
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
  alliance: 'RED' | 'BLUE';
}

export type EventTbaMatchDataResponse = Record<string, unknown>;

export const eventTbaMatchDataQueryKey = ({
  matchNumber,
  matchLevel,
  teamNumber,
  alliance,
}: EventTbaMatchDataRequest) =>
  ['event-tbaMatchData', matchLevel, matchNumber, teamNumber, alliance] as const;

export const fetchEventTbaMatchData = (body: EventTbaMatchDataRequest) =>
  apiFetch<EventTbaMatchDataResponse>('event/tbaMatchData', {
    method: 'POST',
    json: body as unknown as JsonBody,
  });

export const useEventTbaMatchData = (
  body: EventTbaMatchDataRequest | undefined,
  { enabled }: { enabled?: boolean } = {}
) => {
  const isEnabled = Boolean(body) && (enabled ?? true);

  return useQuery({
    queryKey: body ? eventTbaMatchDataQueryKey(body) : ['event-tbaMatchData'],
    queryFn: () => {
      if (!body) {
        throw new Error('Missing request body for event/tbaMatchData');
      }

      return fetchEventTbaMatchData(body);
    },
    enabled: isEnabled,
  });
};
