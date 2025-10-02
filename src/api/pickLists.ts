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

export interface UpdatePickListGeneratorRequest {
  generator: PickListGenerator;
}

export const updatePickListGenerator = ({ generator }: UpdatePickListGeneratorRequest) =>
  apiFetch<PickListGenerator>('picklists/generators', {
    method: 'PATCH',
    json: generator,
  });

export const useUpdatePickListGenerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePickListGenerator,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListGeneratorsQueryKey() });
    },
  });
};

export interface DeletePickListGeneratorRequest {
  id: string;
}

export const deletePickListGenerator = (payload: DeletePickListGeneratorRequest) =>
  apiFetch<void>('picklists/generators', {
    method: 'DELETE',
    json: payload,
  });

export const useDeletePickListGenerator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePickListGenerator,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListGeneratorsQueryKey() });
    },
  });
};

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
  generatorId?: string;
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

export interface CreatePickListGeneratorRequest {
  title: string;
  notes?: string;
}

export const createPickListGenerator = ({ title, notes = '' }: CreatePickListGeneratorRequest) =>
  apiFetch<PickListGenerator>('picklists/generators', {
    method: 'POST',
    json: {
      title,
      favorited: false,
      notes,
    },
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

export interface UpdatePickListRequest {
  id: string;
  title: string;
  notes: string;
  favorited: boolean;
  ranks: PickListRank[];
}

export const updatePickList = (payload: UpdatePickListRequest) =>
  apiFetch<PickList>('picklists', {
    method: 'PATCH',
    json: [payload],
  });

export const useUpdatePickList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePickList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListsQueryKey() });
    },
  });
};

export interface DeletePickListRequest {
  id: string;
}

export const deletePickList = (payload: DeletePickListRequest) =>
  apiFetch<void>('picklists', {
    method: 'DELETE',
    json: payload,
  });

export const useDeletePickList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePickList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pickListsQueryKey() });
    },
  });
};
