import { type ReactNode, useMemo, useState } from 'react';
import { IconChevronDown, IconChevronUp, IconSearch, IconCheck, IconCircleX  } from '@tabler/icons-react';
import { Box, Center, Group, Loader, ScrollArea, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import { DataManagerButtonMenu } from './DataManagerButtonMenu';
import { ExportHeader } from '../ExportHeader/ExportHeader';
import classes from './DataManager.module.css';
import { useMatchSchedule } from '@/api';

interface RowData {
  matchNumber: number;
  red1: number;
  red2: number;
  red3: number;
  blue1: number;
  blue2: number;
  blue3: number;
  fullyScouted: boolean;
}

interface ThProps {
  children: ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const teamNumberKeys: (keyof RowData)[] = ['red1', 'red2', 'red3', 'blue1', 'blue2', 'blue3'];

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

export function DataManager() {
  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();
  const [matchSearch, setMatchSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const schedule = useMemo<RowData[]>(
    () =>
      scheduleData.map((match) => ({
        matchNumber: match.match_number,
        red1: match.red1_id,
        red2: match.red2_id,
        red3: match.red3_id,
        blue1: match.blue1_id,
        blue2: match.blue2_id,
        blue3: match.blue3_id,
        fullyScouted: false,
      })),
    [scheduleData]
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
        <DataManagerButtonMenu matchNumber={row.matchNumber} />
      </Table.Td>
      <Table.Td className={classes.redCell}>{row.red1}</Table.Td>
      <Table.Td className={classes.redCell}>{row.red2}</Table.Td>
      <Table.Td className={classes.redCell}>{row.red3}</Table.Td>
      <Table.Td className={classes.blueCell}>{row.blue1}</Table.Td>
      <Table.Td className={classes.blueCell}>{row.blue2}</Table.Td>
      <Table.Td className={classes.blueCell}>{row.blue3}</Table.Td>
      <Table.Td>
        { row.fullyScouted ? 
        <IconCheck size={30}/> :
        <IconCircleX size={30}/>}
      </Table.Td>
    </Table.Tr>
  ));

  const totalColumns = 2 + teamNumberKeys.length;

  let tableBody: ReactNode;
  if (isLoading) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={totalColumns}>
          <Center mih={120}>
            <Loader />
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  } else if (isError) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={totalColumns}>
          <Center mih={120}>
            <Text c="red.6" fw={500}>
              Unable to load the match schedule.
            </Text>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  } else if (schedule.length === 0) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={totalColumns}>
          <Center mih={120}>
            <Text fw={500}>No matches are available for this event.</Text>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  } else if (rows.length === 0) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={totalColumns}>
          <Text fw={500} ta="center">
            Nothing found
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  } else {
    tableBody = rows;
  }

  return (
    <>
      <Box>
        <ExportHeader />
      </Box>
      <ScrollArea>
        <Stack gap="md">
          <Group gap="md" grow>
            <TextInput
              placeholder="Filter by match number"
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={matchSearch}
              onChange={handleMatchSearchChange}
              disabled={isLoading || isError || schedule.length === 0}
            />
            <TextInput
              placeholder="Filter by team number"
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={teamSearch}
              onChange={handleTeamSearchChange}
              disabled={isLoading || isError || schedule.length === 0}
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
                <Table.Th>Fully Scouted?</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{tableBody}</Table.Tbody>
          </Table>
        </Stack>
      </ScrollArea>
    </>
  );
}
