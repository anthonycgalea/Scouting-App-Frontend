import { useMemo, useState } from 'react';
import { IconCheck, IconChevronDown, IconChevronUp, IconCircleX, IconSearch } from '@tabler/icons-react';
import { Center, Group, ScrollArea, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import clsx from 'clsx';
import {
  useMatchScheduleSimulation,
  useTeamMatchValidation,
  type MatchScheduleEntry,
  type MatchSimulation2025,
  type MatchSimulationResponse,
} from '@/api';
import { MatchNumberButtonMenu } from './MatchNumberButtonMenu';
import classes from './MatchSchedule.module.css';

interface RowData {
  matchNumber: number;
  matchLevel: string;
  red1?: number | null;
  red2?: number | null;
  red3?: number | null;
  blue1?: number | null;
  blue2?: number | null;
  blue3?: number | null;
  prediction?: MatchPrediction;
  played?: boolean;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const teamNumberKeys: (keyof RowData)[] = ['red1', 'red2', 'red3', 'blue1', 'blue2', 'blue3'];

type MatchPredictionWinner = 'red' | 'blue' | 'even';

interface MatchPrediction {
  winner: MatchPredictionWinner;
  percentage: number | null;
}

const totalTableColumns = 1 + teamNumberKeys.length + 2;

const createMatchKey = (matchLevel: string, matchNumber: number) =>
  `${matchLevel.toLowerCase()}-${matchNumber}`;

const isSimulationWithMeta = (
  simulation: MatchSimulationResponse
): simulation is MatchSimulation2025 =>
  typeof simulation === 'object' &&
  simulation !== null &&
  'match_level' in simulation &&
  'match_number' in simulation &&
  'red_alliance_win_pct' in simulation &&
  'blue_alliance_win_pct' in simulation;

const createPredictionLookup = (simulations?: MatchSimulationResponse[]) => {
  const lookup = new Map<string, MatchPrediction>();

  simulations?.forEach((simulation) => {
    if (!isSimulationWithMeta(simulation)) {
      return;
    }

    const redWinPct = simulation.red_alliance_win_pct;
    const blueWinPct = simulation.blue_alliance_win_pct;

    if (typeof redWinPct !== 'number' || typeof blueWinPct !== 'number') {
      return;
    }

    let winner: MatchPredictionWinner = 'even';
    let percentage: number | null = redWinPct;

    if (redWinPct > blueWinPct) {
      winner = 'red';
      percentage = redWinPct;
    } else if (blueWinPct > redWinPct) {
      winner = 'blue';
      percentage = blueWinPct;
    }

    const matchKey = createMatchKey(simulation.match_level, simulation.match_number);
    lookup.set(matchKey, { winner, percentage });
  });

  return lookup;
};

const createRowData = (
  matches: MatchScheduleEntry[],
  predictions: Map<string, MatchPrediction>,
  playedMatches?: Set<string>,
  isValidationReady?: boolean
): RowData[] =>
  matches.map((match) => {
    const matchKey = createMatchKey(match.match_level, match.match_number);

    return {
      matchNumber: match.match_number,
      matchLevel: match.match_level,
      red1: match.red1_id,
      red2: match.red2_id,
      red3: match.red3_id,
      blue1: match.blue1_id,
      blue2: match.blue2_id,
      blue3: match.blue3_id,
      prediction: predictions.get(matchKey) ?? undefined,
      played: isValidationReady ? playedMatches?.has(matchKey) ?? false : undefined,
    };
  });


function Th({ children, reversed, onSort }: ThProps) {
  const Icon = reversed ? IconChevronDown : IconChevronUp;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="center" gap="xs" align="center">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(
  data: RowData[],
  { matchSearch, teamSearch }: { matchSearch: string; teamSearch: string }
) {
  const matchQuery = matchSearch.trim();
  const matchNumberQuery = Number(matchQuery);
  const teamQuery = teamSearch.toLowerCase().trim();

  return data.filter((item) => {
    const matchMatches = matchQuery
      ? !Number.isNaN(matchNumberQuery) && item.matchNumber === matchNumberQuery
      : true;

    const teamMatches = teamQuery
      ? teamNumberKeys.some((key) => {
          const teamNumber = item[key];
          if (teamNumber === null || teamNumber === undefined) {
            return false;
          }

          return teamNumber.toString().toLowerCase() === teamQuery ;
        })
      : true;

    return matchMatches && teamMatches;
  });
}

function sortData(
  data: RowData[],
  payload: { reversed: boolean; matchSearch: string; teamSearch: string }
) {
  const sorted = [...data].sort((a, b) =>
    payload.reversed ? b.matchNumber - a.matchNumber : a.matchNumber - b.matchNumber
  );

  return filterData(sorted, { matchSearch: payload.matchSearch, teamSearch: payload.teamSearch });
}

const formatWinPercentage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  const normalized = Math.max(0, Math.min(1, value));

  return `${(normalized * 100).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}%`;
};

interface MatchScheduleProps {
  matches: MatchScheduleEntry[];
}

export function MatchSchedule({ matches }: MatchScheduleProps) {
  const [matchSearch, setMatchSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const { data: simulationResults } = useMatchScheduleSimulation();

  const {
    data: validationEntries,
    isLoading: isValidationLoading,
    isError: isValidationError,
  } = useTeamMatchValidation();

  const playedMatches = useMemo(() => {
    if (!validationEntries || isValidationError) {
      return undefined;
    }

    const played = new Set<string>();
    validationEntries.forEach((entry) => {
      played.add(createMatchKey(entry.match_level, entry.match_number));
    });

    return played;
  }, [validationEntries, isValidationError]);

  const isValidationReady = !isValidationLoading && !isValidationError && validationEntries !== undefined;

  const predictionLookup = useMemo(
    () => createPredictionLookup(simulationResults),
    [simulationResults]
  );

  const schedule = useMemo(
    () => createRowData(matches, predictionLookup, playedMatches, isValidationReady),
    [matches, predictionLookup, playedMatches, isValidationReady]
  );

  const sortedData = useMemo(
    () => sortData(schedule, { reversed: reverseSortDirection, matchSearch, teamSearch }),
    [schedule, reverseSortDirection, matchSearch, teamSearch]
  );

  const setSorting = () => {
    setReverseSortDirection((current) => !current);
  };

  const handleMatchSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMatchSearch(value);
  };

  const handleTeamSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setTeamSearch(value);
  };

  const rows = sortedData.map((row) => {
    const predictionClassName = clsx(classes.predictionCell, {
      [classes.predictionRed]: row.prediction?.winner === 'red',
      [classes.predictionBlue]: row.prediction?.winner === 'blue',
      [classes.predictionNeutral]: !row.prediction || row.prediction.winner === 'even',
    });

    const predictionContent = row.prediction ? (
      <Stack gap={0} align="center" justify="center">
        <Text fw={600}>{`${
          row.prediction.winner === 'red'
            ? 'Red'
            : row.prediction.winner === 'blue'
              ? 'Blue'
              : 'Even'
        }:`}</Text>
        <Text fw={600}>{formatWinPercentage(row.prediction.percentage)}</Text>
      </Stack>
    ) : (
      <Text c="dimmed" fz="sm">
        N/A
      </Text>
    );

    return (
      <Table.Tr key={row.matchNumber}>
        <Table.Td>
          <MatchNumberButtonMenu
            matchNumber={row.matchNumber}
            matchLevel={row.matchLevel}
          />
        </Table.Td>
        <Table.Td className={classes.redCell}>{row.red1 ?? '-'}</Table.Td>
        <Table.Td className={classes.redCell}>{row.red2 ?? '-'}</Table.Td>
        <Table.Td className={classes.redCell}>{row.red3 ?? '-'}</Table.Td>
        <Table.Td className={predictionClassName}>{predictionContent}</Table.Td>
        <Table.Td className={classes.blueCell}>{row.blue1 ?? '-'}</Table.Td>
        <Table.Td className={classes.blueCell}>{row.blue2 ?? '-'}</Table.Td>
        <Table.Td className={classes.blueCell}>{row.blue3 ?? '-'}</Table.Td>
        <Table.Td>
          {row.played === undefined ? (
            <Text c="dimmed" fz="sm">
              N/A
            </Text>
          ) : row.played ? (
            <IconCheck size={30} />
          ) : (
            <IconCircleX size={30} />
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <ScrollArea>
      <Stack gap="md">
        <Group gap="md" grow>
          <TextInput
            placeholder="Filter by match number"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={matchSearch}
            onChange={handleMatchSearchChange}
          />
          <TextInput
            placeholder="Filter by team number"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={teamSearch}
            onChange={handleTeamSearchChange}
          />
        </Group>
        <Table
          horizontalSpacing="md"
          verticalSpacing="xs"
          miw={700}
          layout="fixed"
          className={classes.table}
        >
          <Table.Thead>
            <Table.Tr>
              <Th sorted reversed={reverseSortDirection} onSort={setSorting}>
                Match #
              </Th>
              <Table.Th>Red 1</Table.Th>
              <Table.Th>Red 2</Table.Th>
              <Table.Th>Red 3</Table.Th>
              <Table.Th>Prediction</Table.Th>
              <Table.Th>Blue 1</Table.Th>
              <Table.Th>Blue 2</Table.Th>
              <Table.Th>Blue 3</Table.Th>
              <Table.Th>Played</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={totalTableColumns}>
                  <Text fw={500} ta="center">
                    Nothing found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Stack>
    </ScrollArea>
  );
}
