import { useState } from 'react';
import { IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import { Center, Group, ScrollArea, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import classes from './TableSort.module.css';

interface RowData {
  matchNumber: number;
  red1: number;
  red2: number;
  red3: number;
  blue1: number;
  blue2: number;
  blue3: number;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const teamNumberKeys: (keyof RowData)[] = ['red1', 'red2', 'red3', 'blue1', 'blue2', 'blue3'];

const schedule: RowData[] = [
  { matchNumber: 1, red1: 1678, red2: 4414, red3: 5940, blue1: 254, blue2: 971, blue3: 840 },
  { matchNumber: 2, red1: 973, red2: 649, red3: 115, blue1: 118, blue2: 148, blue3: 3647 },
  { matchNumber: 3, red1: 2122, red2: 2471, red3: 2990, blue1: 3847, blue2: 5026, blue3: 8033 },
  { matchNumber: 4, red1: 1323, red2: 2046, red3: 5818, blue1: 1538, blue2: 359, blue3: 4419 },
  { matchNumber: 5, red1: 604, red2: 2813, red3: 3250, blue1: 1671, blue2: 3255, blue3: 5109 },
  { matchNumber: 6, red1: 4541, red2: 4183, red3: 4255, blue1: 4334, blue2: 3310, blue3: 589 },
  { matchNumber: 7, red1: 6800, red2: 624, red3: 4587, blue1: 6240, blue2: 5012, blue3: 5414 },
  { matchNumber: 8, red1: 5667, red2: 2473, red3: 6814, blue1: 5419, blue2: 5700, blue3: 6913 },
  { matchNumber: 9, red1: 238, red2: 78, red3: 226, blue1: 125, blue2: 195, blue3: 1474 },
  { matchNumber: 10, red1: 3538, red2: 27, red3: 494, blue1: 3620, blue2: 469, blue3: 910 },
  { matchNumber: 11, red1: 4143, red2: 930, red3: 2830, blue1: 1732, blue2: 2062, blue3: 3352 },
  { matchNumber: 12, red1: 2056, red2: 1241, red3: 3683, blue1: 1114, blue2: 4039, blue3: 1310 },
  { matchNumber: 13, red1: 4481, red2: 2767, red3: 4003, blue1: 2481, blue2: 217, blue3: 3026 },
  { matchNumber: 14, red1: 71, red2: 45, red3: 1024, blue1: 234, blue2: 245, blue3: 829 },
  { matchNumber: 15, red1: 987, red2: 6045, red3: 5499, blue1: 399, blue2: 4145, blue3: 585 },
  { matchNumber: 16, red1: 1619, red2: 2992, red3: 179, blue1: 1339, blue2: 4068, blue3: 4388 },
  { matchNumber: 17, red1: 433, red2: 708, red3: 1710, blue1: 1806, blue2: 1939, blue3: 2410 },
  { matchNumber: 18, red1: 303, red2: 222, red3: 7083, blue1: 2590, blue2: 223, blue3: 1257 },
  { matchNumber: 19, red1: 870, red2: 287, red3: 1519, blue1: 353, blue2: 1885, blue3: 5960 },
  { matchNumber: 20, red1: 862, red2: 1718, red3: 2959, blue1: 5561, blue2: 6077, blue3: 858 },
];


function Th({ children, reversed, onSort }: ThProps) {
  const Icon = reversed ? IconChevronDown : IconChevronUp;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
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
  const teamQuery = teamSearch.toLowerCase().trim();

  return data.filter((item) => {
    const matchMatches = matchQuery
      ? item.matchNumber.toString().includes(matchQuery)
      : true;

    const teamMatches = teamQuery
      ? teamNumberKeys.some((key) => item[key].toString().toLowerCase().includes(teamQuery))
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

export function TableSort() {
  const [matchSearch, setMatchSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [sortedData, setSortedData] = useState(() =>
    sortData(schedule, { reversed: false, matchSearch: '', teamSearch: '' })
  );

  const setSorting = () => {
    const reversed = !reverseSortDirection;
    setReverseSortDirection(reversed);
    setSortedData(sortData(schedule, { reversed, matchSearch, teamSearch }));
  };

  const handleMatchSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMatchSearch(value);
    setSortedData(
      sortData(schedule, { reversed: reverseSortDirection, matchSearch: value, teamSearch })
    );
  };

  const handleTeamSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setTeamSearch(value);
    setSortedData(
      sortData(schedule, { reversed: reverseSortDirection, matchSearch, teamSearch: value })
    );
  };

  const rows = sortedData.map((row) => (
    <Table.Tr key={row.matchNumber}>
      <Table.Td>{row.matchNumber}</Table.Td>
      <Table.Td>{row.red1}</Table.Td>
      <Table.Td>{row.red2}</Table.Td>
      <Table.Td>{row.red3}</Table.Td>
      <Table.Td>{row.blue1}</Table.Td>
      <Table.Td>{row.blue2}</Table.Td>
      <Table.Td>{row.blue3}</Table.Td>
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
        <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout="fixed">
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
