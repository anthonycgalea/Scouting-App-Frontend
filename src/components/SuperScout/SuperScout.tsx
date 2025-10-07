import { useMemo, useState } from 'react';
import { IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import {
  Button,
  Center,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useSuperScoutStatuses, type MatchScheduleEntry } from '@/api';
import classes from './SuperScout.module.css';

interface RowData {
  matchNumber: number;
  red1?: number | null;
  red2?: number | null;
  red3?: number | null;
  blue1?: number | null;
  blue2?: number | null;
  blue3?: number | null;
  matchLevel?: string | null;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const createRowData = (matches: MatchScheduleEntry[]): RowData[] =>
  matches.map((match) => ({
    matchNumber: match.match_number,
    red1: match.red1_id,
    red2: match.red2_id,
    red3: match.red3_id,
    blue1: match.blue1_id,
    blue2: match.blue2_id,
    blue3: match.blue3_id,
    matchLevel: match.match_level,
  }));

function Th({ children, reversed, sorted: _sorted, onSort }: ThProps) {
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

function filterData(data: RowData[], matchSearch: string) {
  const matchQuery = matchSearch.trim();
  const matchNumberQuery = Number(matchQuery);

  return data.filter((item) =>
    matchQuery ? !Number.isNaN(matchNumberQuery) && item.matchNumber === matchNumberQuery : true
  );
}

function sortData(data: RowData[], payload: { reversed: boolean; matchSearch: string }) {
  const sorted = [...data].sort((a, b) =>
    payload.reversed ? b.matchNumber - a.matchNumber : a.matchNumber - b.matchNumber
  );

  return filterData(sorted, payload.matchSearch);
}

interface SuperScoutProps {
  matches: MatchScheduleEntry[];
}

export function SuperScout({ matches }: SuperScoutProps) {
  const [matchSearch, setMatchSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const { colorScheme } = useMantineColorScheme();
  const allianceButtonVariant = colorScheme === 'dark' ? 'light' : 'filled';

  const { data: superScoutStatuses = [] } = useSuperScoutStatuses();

  const schedule = useMemo(() => createRowData(matches), [matches]);

  const superscoutedByMatch = useMemo(() => {
    const statusMap = new Map<string, { red: boolean; blue: boolean }>();

    superScoutStatuses.forEach((status) => {
      const level = status.matchLevel?.toLowerCase();

      if (!level) {
        return;
      }

      statusMap.set(`${level}-${status.matchNumber}`, {
        red: status.red,
        blue: status.blue,
      });
    });

    return statusMap;
  }, [superScoutStatuses]);

  const sortedData = useMemo(
    () => sortData(schedule, { reversed: reverseSortDirection, matchSearch }),
    [schedule, reverseSortDirection, matchSearch]
  );

  const setSorting = () => {
    setReverseSortDirection((current) => !current);
  };

  const handleMatchSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMatchSearch(value);
  };

  const formatAlliance = (teams: Array<number | null | undefined>) =>
    teams.map((team) => (team ?? '-')).join(' • ');

  const rows = sortedData.map((row) => {
    const matchLevelPath = row.matchLevel?.toLowerCase();
    const matchStatus = matchLevelPath
      ? superscoutedByMatch.get(`${matchLevelPath}-${row.matchNumber}`)
      : undefined;
    const isRedSuperscouted = matchStatus?.red ?? false;
    const isBlueSuperscouted = matchStatus?.blue ?? false;

    const redAllianceButton = matchLevelPath ? (
      <Button<typeof Link>
        color="red"
        component={Link}
        fullWidth
        to={`/superScout/match/${matchLevelPath}/${row.matchNumber}/red`}
        variant={allianceButtonVariant}
        disabled={isRedSuperscouted}
      >
        {formatAlliance([row.red1, row.red2, row.red3])}
      </Button>
    ) : (
      <Button color="red" disabled fullWidth variant={allianceButtonVariant}>
        {formatAlliance([row.red1, row.red2, row.red3])}
      </Button>
    );

    const blueAllianceButton = matchLevelPath ? (
      <Button<typeof Link>
        color="blue"
        component={Link}
        fullWidth
        to={`/superScout/match/${matchLevelPath}/${row.matchNumber}/blue`}
        variant={allianceButtonVariant}
        disabled={isBlueSuperscouted}
      >
        {formatAlliance([row.blue1, row.blue2, row.blue3])}
      </Button>
    ) : (
      <Button color="blue" disabled fullWidth variant={allianceButtonVariant}>
        {formatAlliance([row.blue1, row.blue2, row.blue3])}
      </Button>
    );

    return (
      <Table.Tr key={row.matchNumber}>
        <Table.Td>{row.matchNumber}</Table.Td>
        <Table.Td>{redAllianceButton}</Table.Td>
        <Table.Td>{blueAllianceButton}</Table.Td>
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
        </Group>
        <Table
          horizontalSpacing="md"
          verticalSpacing="xs"
          miw={500}
          layout="fixed"
          className={classes.table}
        >
          <Table.Thead>
            <Table.Tr>
              <Th sorted reversed={reverseSortDirection} onSort={setSorting}>
                Match #
              </Th>
              <Table.Th>Red Alliance</Table.Th>
              <Table.Th>Blue Alliance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
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
