import { useMemo, useState } from 'react';
import { IconCheck, IconChevronDown, IconChevronUp, IconCircleX, IconSearch } from '@tabler/icons-react';
import { Center, Group, ScrollArea, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import { useTeamMatchValidation } from '@/api';
import type { MatchScheduleEntry } from '@/api';
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
  played?: boolean;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const teamNumberKeys: (keyof RowData)[] = ['red1', 'red2', 'red3', 'blue1', 'blue2', 'blue3'];

const createMatchKey = (matchLevel: string, matchNumber: number) =>
  `${matchLevel.toLowerCase()}-${matchNumber}`;

const createRowData = (
  matches: MatchScheduleEntry[],
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

interface MatchScheduleProps {
  matches: MatchScheduleEntry[];
}

export function MatchSchedule({ matches }: MatchScheduleProps) {
  const [matchSearch, setMatchSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

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

  const schedule = useMemo(
    () => createRowData(matches, playedMatches, isValidationReady),
    [matches, playedMatches, isValidationReady]
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

  const rows = sortedData.map((row) => (
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
  ));

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
                <Table.Td colSpan={1 + teamNumberKeys.length}>
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
