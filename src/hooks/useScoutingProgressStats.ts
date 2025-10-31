import { useMemo } from 'react';
import {
  useEventPitScoutRecords,
  useEventTeamImages,
  useEventTeams,
  useMatchSchedule,
  useTeamMatchValidation,
  useSuperScoutStatuses,
} from '@/api';
import type { StatsRingDataItem } from '@/components/StatsRing/StatsRing';

const TEAMS_PER_MATCH = 6;

const isQualificationMatch = (matchLevel?: string | null) =>
  (matchLevel ?? '').trim().toLowerCase() === 'qm';

export function useScoutingProgressStats() {
  const {
    data: scheduleData = [],
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useMatchSchedule();
  const {
    data: validationData = [],
    isLoading: isValidationLoading,
    isError: isValidationError,
  } = useTeamMatchValidation();
  const {
    data: eventTeams = [],
    isLoading: isEventTeamsLoading,
    isError: isEventTeamsError,
  } = useEventTeams();
  const {
    data: pitScoutRecords = [],
    isLoading: isPitScoutingLoading,
    isError: isPitScoutingError,
  } = useEventPitScoutRecords();
  const {
    data: teamImages = [],
    isLoading: isTeamImagesLoading,
    isError: isTeamImagesError,
  } = useEventTeamImages();
  const {
    data: superScoutStatuses = [],
    isLoading: isSuperScoutStatusesLoading,
    isError: isSuperScoutStatusesError,
  } = useSuperScoutStatuses();

  const stats = useMemo(() => {
    const items: StatsRingDataItem[] = [];

    const qualificationMatches = scheduleData.filter((match) =>
      isQualificationMatch(match.match_level)
    );

    const totalQualificationMatches = qualificationMatches.length;
    const totalPossibleRecords = totalQualificationMatches * TEAMS_PER_MATCH;

    if (totalPossibleRecords > 0) {
      const qualificationValidation = validationData.filter((entry) =>
        isQualificationMatch(entry.match_level)
      );

      const totalQualificationRecords = qualificationValidation.length;
      const validatedQualificationRecords = qualificationValidation.filter(
        (entry) => entry.validation_status === 'VALID'
      ).length;
      const unvalidatedQualificationRecords = Math.max(
        totalQualificationRecords - validatedQualificationRecords,
        0
      );

      items.push({
        label: 'Team Matches',
        current: totalQualificationRecords,
        total: totalPossibleRecords,
        color: 'yellow.6',
        primaryLabel: 'Scouted',
        progress: {
          current: unvalidatedQualificationRecords,
          total: totalPossibleRecords,
        },
        secondary: {
          label: 'Validated',
          current: validatedQualificationRecords,
          total: totalPossibleRecords,
          color: 'teal.5',
        },
      });
    }

    const totalTeams = eventTeams.length;

    if (totalTeams > 0) {
      const eventTeamNumbers = new Set(eventTeams.map((team) => team.team_number));

      const pitScoutedTeams = pitScoutRecords.reduce((set, record) => {
        if (eventTeamNumbers.has(record.team_number)) {
          set.add(record.team_number);
        }

        return set;
      }, new Set<number>()).size;

      const photoTeams = teamImages.reduce((set, teamImage) => {
        const teamNumber = teamImage.teamNumber;

        if (eventTeamNumbers.has(teamNumber)) {
          set.add(teamNumber);
        }

        return set;
      }, new Set<number>()).size;

      items.push(
        {
          label: 'Teams Pit Scouted',
          current: pitScoutedTeams,
          total: totalTeams,
          color: 'indigo.6',
        },
        {
          label: 'Robot Photos Taken',
          current: photoTeams,
          total: totalTeams,
          color: 'cyan.6',
        }
      );
    }

    const qualificationEventKeys = new Set(
      qualificationMatches.map((match) => match.event_key)
    );
    const totalQualificationAlliances = totalQualificationMatches * 2;

    if (totalQualificationAlliances > 0) {
      const alliancesSuperScouted = superScoutStatuses.reduce((count, status) => {
        if (
          !qualificationEventKeys.has(status.eventCode) ||
          !isQualificationMatch(status.matchLevel)
        ) {
          return count;
        }

        const redCount = status.red ? 1 : 0;
        const blueCount = status.blue ? 1 : 0;

        return count + redCount + blueCount;
      }, 0);

      items.push({
        label: 'Alliances SuperScouted',
        current: Math.min(alliancesSuperScouted, totalQualificationAlliances),
        total: totalQualificationAlliances,
        color: 'orange.6',
      });
    }

    return items;
  }, [
    scheduleData,
    validationData,
    eventTeams,
    pitScoutRecords,
    teamImages,
    superScoutStatuses,
  ]);

  return {
    stats,
    isLoading:
      isScheduleLoading ||
      isValidationLoading ||
      isEventTeamsLoading ||
      isPitScoutingLoading ||
      isTeamImagesLoading ||
      isSuperScoutStatusesLoading,
    isError:
      isScheduleError ||
      isValidationError ||
      isEventTeamsError ||
      isPitScoutingError ||
      isTeamImagesError ||
      isSuperScoutStatusesError,
  };
}
