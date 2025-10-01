import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from './httpClient';

export interface PickListRank {
  rank: number;
  team_number: number;
  notes: string;
  dnp: boolean;
}

export interface PickList {
  id: string;
  season: number;
  organization_id: number;
  event_key: string;
  title: string;
  notes: string;
  created: string;
  last_updated: string;
  favorited: boolean;
  ranks: PickListRank[];
}

export interface PickListGeneratorBase {
  id: string;
  season: number;
  organization_id: number;
  title: string;
  notes: string;
  timestamp: string;
  favorited: boolean;
}

export type PickListGenerator = PickListGeneratorBase & {
  [key: string]: string | number | boolean | null;
};

export const pickListsQueryKey = () => ['picklists'] as const;

export const fetchPickLists = () => apiFetch<PickList[]>('picklists');

export const usePickLists = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: pickListsQueryKey(),
    queryFn: fetchPickLists,
    enabled: enabled ?? true,
  });

export const pickListGeneratorsQueryKey = () => ['picklists', 'generators'] as const;

export const fetchPickListGenerators = () =>
  apiFetch<PickListGenerator[]>('picklists/generators');

export const usePickListGenerators = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: pickListGeneratorsQueryKey(),
    queryFn: fetchPickListGenerators,
    enabled: enabled ?? true,
  });

export interface CreatePickListRank {
  rank: number;
  team_number: number;
  notes?: string;
  dnp?: boolean;
}

export interface CreatePickListRequest {
  title: string;
  notes?: string;
  ranks: CreatePickListRank[];
}

export const createPickList = (payload: CreatePickListRequest) =>
  apiFetch<PickList>('picklists', {
    method: 'POST',
    json: payload,
  });

export const useCreatePickList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPickList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListsQueryKey() });
    },
  });
};

export type CreatePickListGeneratorRequest = {
  title: string;
  notes?: string;
} & {
  [key: string]: string | number | boolean | null | undefined;
};

export const createPickListGenerator = (payload: CreatePickListGeneratorRequest) =>
  apiFetch<PickListGenerator>('picklists/generators', {
    method: 'POST',
    json: payload,
  });

export const useCreatePickListGenerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPickListGenerator,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListGeneratorsQueryKey() });
    },
  });
};
