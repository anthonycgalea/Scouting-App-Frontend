import type { MatchScheduleEntry } from '@/api';
import type { MatchScheduleSection } from './MatchScheduleToggle';

export const SECTION_DEFINITIONS: ReadonlyArray<{
  value: MatchScheduleSection;
  label: string;
}> = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'finals', label: 'Finals' },
];

export const groupMatchesBySection = (matches: MatchScheduleEntry[]) => {
  const grouped: Record<MatchScheduleSection, MatchScheduleEntry[]> = {
    qualification: [],
    playoffs: [],
    finals: [],
  };

  matches.forEach((match) => {
    const matchLevel = match.match_level?.toLowerCase();

    if (matchLevel === 'qm') {
      grouped.qualification.push(match);
    } else if (matchLevel === 'sf') {
      grouped.playoffs.push(match);
    } else if (matchLevel === 'f') {
      grouped.finals.push(match);
    }
  });

  return grouped;
};
