import { Button } from '@mantine/core';
import { Link } from '@tanstack/react-router';

interface MatchNumberButtonMenuProps {
  matchNumber: number;
  matchLevel: string;
}

export function MatchNumberButtonMenu({ matchNumber, matchLevel }: MatchNumberButtonMenuProps) {
  return (
    <Button
      component={Link}
      to={`/matches/preview/${matchLevel}/${matchNumber}`}
      aria-label={`Preview match ${matchNumber}`}
      radius="md"
      variant="subtle"
    >
      Match {matchNumber}
    </Button>
  );
}
