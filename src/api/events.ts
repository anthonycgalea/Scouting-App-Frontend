import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { apiFetch, type JsonBody } from './httpClient';
import { matchScheduleQueryKey, teamMatchValidationQueryKey } from './matches';
import {
  pickListGeneratorsQueryKey,
  pickListsQueryKey,
} from './pickLists';
import {
  teamAnalyticsQueryKey,
  teamDetailedAnalyticsQueryKey,
  teamHeadToHeadQueryKey,
  teamMatchHistoryQueryKey,
  teamZScoresQueryKey,
} from './analytics';
import { eventTeamsQueryKey } from './teams';

export interface EventSummary {
  event_key: string;
  event_name: string;
  short_name: string;
  year: number;
  week: number;
}

export interface OrganizationEventDetail {
  organizationEventId?: string;
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

export interface DeleteOrganizationEventRequest {
  eventKey: string;
}

export const eventsQueryKey = (year: number) => ['events', year] as const;

export const fetchEvents = (year: number) => apiFetch<EventSummary[]>(`events/${year}`);

export const useEvents = (year: number) =>
  useQuery<EventSummary[]>({
    queryKey: eventsQueryKey(year),
    queryFn: () => fetchEvents(year),
  });

export interface EventRanking {
  event_key: string;
  rank: number;
  team_number: number;
  team_name: string | null;
  ranking_points: number;
  matches_played: number;
  ranking_tiebreaker_1: number;
  ranking_tiebreaker_2: number;
}

export const eventRankingsQueryKey = () => ['event-rankings'] as const;

export const fetchEventRankings = () => apiFetch<EventRanking[]>('event/rankings');

export const useEventRankings = ({ enabled }: { enabled?: boolean } = {}) => {
  const shouldEnable = enabled ?? true;

  return useQuery<EventRanking[]>({
    queryKey: eventRankingsQueryKey(),
    queryFn: fetchEventRankings,
    enabled: shouldEnable,
  });
};

export const eventInfoQueryKey = () => ['event-info'] as const;

export const fetchEventInfo = () => apiFetch<EventSummary>('event/info');

export const useEventInfo = () =>
  useQuery<EventSummary>({
    queryKey: eventInfoQueryKey(),
    queryFn: fetchEventInfo,
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

const eventQueryKeys: QueryKey[] = [
  organizationEventsQueryKey(),
  eventRankingsQueryKey(),
  eventInfoQueryKey(),
  eventTeamsQueryKey(),
  matchScheduleQueryKey(),
  teamMatchValidationQueryKey(),
  pickListsQueryKey(),
  pickListGeneratorsQueryKey(),
  teamAnalyticsQueryKey(),
  teamDetailedAnalyticsQueryKey(),
  teamHeadToHeadQueryKey(),
  teamMatchHistoryQueryKey(),
  teamZScoresQueryKey(),
];

const eventQueryPrefixes = new Set<string>([
  'event-tbaMatchData',
  'scout-match',
  'pit-scout',
  'team-match-data',
]);

const invalidateEventDataQueries = async (queryClient: QueryClient) => {
  await Promise.all(
    eventQueryKeys.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
      })
    )
  );

  await queryClient.invalidateQueries({
    predicate: (query) => {
      if (!Array.isArray(query.queryKey) || query.queryKey.length === 0) {
        return false;
      }

      const [firstKey] = query.queryKey;

      return typeof firstKey === 'string' && eventQueryPrefixes.has(firstKey);
    },
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

export const deleteOrganizationEvent = (payload: DeleteOrganizationEventRequest) =>
  apiFetch<void>('organization/event', {
    method: 'DELETE',
    json: payload as JsonBody,
  });

export interface UpdateOrganizationEventsVariables {
  events: UpdateOrganizationEventsRequest;
}

export const useUpdateOrganizationEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ events }: UpdateOrganizationEventsVariables) =>
      updateOrganizationEvents(events),
    onSuccess: async () => {
      await invalidateEventDataQueries(queryClient);
    },
  });
};

export const useDeleteOrganizationEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganizationEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationEventsQueryKey(),
      });
    },
  });
};

export const syncEventRankings = () =>
  apiFetch<void>('event/getRankings', { method: 'POST' });

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
