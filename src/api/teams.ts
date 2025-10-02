import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './httpClient';

export interface EventTeam {
  team_number: number;
  team_name: string;
  location: string;
}

export interface TeamInfo {
  team_number: number;
  team_name: string;
  location: string;
  rookieYear: number | null;
}

export interface TeamImage {
  id: string;
  team_number: number;
  event_key: string;
  image_url: string;
  description: string;
  uploaded_at: string;
}

export type Endgame2025 = 'NONE' | 'PARK' | 'SHALLOW' | 'DEEP';

export interface BaseTeamMatchData {
  season: number;
  team_number: number;
  event_key: string;
  match_number: number;
  match_level: string;
  user_id?: string;
  organization_id?: number;
  timestamp?: string;
  notes?: string | null;
}

export interface TeamMatchData2025 extends BaseTeamMatchData {
  al4c: number;
  al3c: number;
  al2c: number;
  al1c: number;
  tl4c: number;
  tl3c: number;
  tl2c: number;
  tl1c: number;
  aNet: number;
  tNet: number;
  aProcessor: number;
  tProcessor: number;
  endgame: Endgame2025;
}

export type TeamMatchData = TeamMatchData2025;

export const eventTeamsQueryKey = (eventCode: string) =>
  ['event-teams', eventCode] as const;

export const fetchEventTeams = (_eventCode: string) => apiFetch<EventTeam[]>('event/teams');

export const useEventTeams = (eventCode = '2025micmp4', { enabled }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: eventTeamsQueryKey(eventCode),
    queryFn: () => fetchEventTeams(eventCode),
    enabled: enabled ?? true,
  });

export const teamInfoQueryKey = (teamNumber: number) =>
  ['team-info', teamNumber] as const;

export const fetchTeamInfo = (teamNumber: number) =>
  apiFetch<TeamInfo>(`teams/${teamNumber}/info`);

export const useTeamInfo = (teamNumber: number) =>
  useQuery({
    queryKey: teamInfoQueryKey(teamNumber),
    queryFn: () => fetchTeamInfo(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });

export const teamImagesQueryKey = (teamNumber: number) =>
  ['team-images', teamNumber] as const;

export const fetchTeamImages = (teamNumber: number) =>
  apiFetch<TeamImage[]>(`teams/${teamNumber}/images`);

export const useTeamImages = (teamNumber: number) =>
  useQuery({
    queryKey: teamImagesQueryKey(teamNumber),
    queryFn: () => fetchTeamImages(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });

export interface UploadTeamImageInput {
  file: File;
  description?: string;
}

export const uploadTeamImage = (teamNumber: number, { file, description }: UploadTeamImageInput) => {
  const formData = new FormData();
  formData.append('file', file);

  if (description) {
    formData.append('description', description);
  }

  return apiFetch<TeamImage>(`teams/${teamNumber}/images`, {
    method: 'POST',
    body: formData,
  });
};

export const useUploadTeamImage = (teamNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadTeamImageInput) => uploadTeamImage(teamNumber, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamImagesQueryKey(teamNumber) });
    },
  });
};

export const teamMatchDataQueryKey = (teamNumber: number) =>
  ['team-match-data', teamNumber] as const;

export const fetchTeamMatchData = (teamNumber: number) =>
  apiFetch<TeamMatchData[]>(`teams/${teamNumber}/matchData`);

export const useTeamMatchData = (teamNumber: number) =>
  useQuery({
    queryKey: teamMatchDataQueryKey(teamNumber),
    queryFn: () => fetchTeamMatchData(teamNumber),
    enabled: Number.isFinite(teamNumber),
  });

