import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export type EndgameOption2025 = 'NONE' | 'PARK' | 'SHALLOW' | 'DEEP';

export interface PitScout2025 {
  season: number;
  team_number: number;
  event_key: string;
  user_id: string | null;
  organization_id: number | null;
  timestamp: string;
  notes: string | null;
  robot_weight: number | null;
  drivetrain: string | null;
  driveteam: string | null;
  startPositionLeft: boolean;
  startPositionCenter: boolean;
  startPositionRight: boolean;
  pickupGround: boolean;
  pickupFeeder: boolean;
  autoL4Coral: boolean;
  autoL3Coral: boolean;
  autoL2Coral: boolean;
  autoL1Coral: boolean;
  autoCoralCount: number | null;
  autoAlgaeNet: number | null;
  autoAlgaeProcessor: number | null;
  autoNotes: string | null;
  teleL4Coral: boolean;
  teleL3Coral: boolean;
  teleL2Coral: boolean;
  teleL1Coral: boolean;
  teleAlgaeNet: boolean;
  teleAlgaeProcessor: boolean;
  teleNotes: string | null;
  endgame: EndgameOption2025;
  overallNotes: string | null;
}

export type PitScout = PitScout2025;

export interface PitScoutIdentifier {
  season: number;
  event_key: string;
  team_number: number;
}

export type PitScoutUpsertPayload = Omit<
  PitScout,
  'season' | 'event_key' | 'user_id' | 'organization_id' | 'timestamp'
>;

const createPitScoutQuery = (teamNumber: number) => {
  const searchParams = new URLSearchParams({ teamNumber: teamNumber.toString(10) });
  return `scout/pit?${searchParams.toString()}`;
};

export const pitScoutQueryKey = (teamNumber: number) => ['pit-scout', teamNumber] as const;

export const fetchPitScoutRecords = (teamNumber: number) =>
  apiFetch<PitScout[]>(createPitScoutQuery(teamNumber));

export const usePitScoutRecords = (teamNumber: number) =>
  useQuery({
    queryKey: pitScoutQueryKey(teamNumber),
    queryFn: () => fetchPitScoutRecords(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });

export const createPitScoutRecord = (record: PitScoutUpsertPayload) =>
  apiFetch<PitScout>('scout/pit', {
    method: 'POST',
    json: record,
  });

export const updatePitScoutRecord = (record: PitScoutUpsertPayload) =>
  apiFetch<PitScout>('scout/pit', {
    method: 'PATCH',
    json: record,
  });

export const deletePitScoutRecord = (identifier: PitScoutIdentifier) =>
  apiFetch<void>('scout/pit', {
    method: 'DELETE',
    json: identifier,
  });

export const useCreatePitScoutRecord = (teamNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPitScoutRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pitScoutQueryKey(teamNumber) });
    },
  });
};

export const useUpdatePitScoutRecord = (teamNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePitScoutRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pitScoutQueryKey(teamNumber) });
    },
  });
};

export const useDeletePitScoutRecord = (teamNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePitScoutRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pitScoutQueryKey(teamNumber) });
    },
  });
};
