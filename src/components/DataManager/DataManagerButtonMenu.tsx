import { Text } from '@mantine/core';

interface MatchNumberButtonMenuProps {
  matchNumber: number;
  matchLevel?: string | null;
}

const MATCH_LEVEL_LABELS: Record<string, string> = {
  qm: 'Qualification',
  sf: 'Playoff',
  f: 'Finals',
};

const formatMatchLevelLabel = (matchLevel?: string | null) => {
  if (!matchLevel) {
    return undefined;
  }

  const normalizedLevel = matchLevel.trim().toLowerCase();

  return MATCH_LEVEL_LABELS[normalizedLevel] ?? matchLevel;
};

export function DataManagerButtonMenu({
  matchNumber,
  matchLevel,
}: MatchNumberButtonMenuProps) {
  const formattedMatchLevel = formatMatchLevelLabel(matchLevel);

  return (
    <Text fw={500} component="span" ta="center">
      {formattedMatchLevel ? `${formattedMatchLevel} Match ${matchNumber}` : `Match ${matchNumber}`}
    </Text>
  );
}
