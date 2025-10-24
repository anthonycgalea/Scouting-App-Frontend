import { useMemo } from 'react';
import { useMatchSchedule, useTeamMatchValidation } from '@/api';

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

  const stats = useMemo(() => {
    const qualificationMatches = scheduleData.filter((match) =>
      isQualificationMatch(match.match_level)
    );

    const totalQualificationMatches = qualificationMatches.length;
    const totalPossibleRecords = totalQualificationMatches * TEAMS_PER_MATCH;

    if (totalPossibleRecords <= 0) {
      return [];
    }

    const qualificationValidation = validationData.filter((entry) =>
      isQualificationMatch(entry.match_level)
    );

    const totalQualificationRecords = qualificationValidation.length;
    const validatedQualificationRecords = qualificationValidation.filter(
      (entry) => entry.validation_status === 'VALID'
    ).length;

    return [
      {
        label: 'Team Matches Scouted',
        current: totalQualificationRecords,
        total: totalPossibleRecords,
        color: 'yellow.6',
      },
      {
        label: 'Matches Validated',
        current: validatedQualificationRecords,
        total: totalPossibleRecords,
        color: 'green.6',
      },
    ];
  }, [scheduleData, validationData]);

  return {
    stats,
    isLoading: isScheduleLoading || isValidationLoading,
    isError: isScheduleError || isValidationError,
  };
}
