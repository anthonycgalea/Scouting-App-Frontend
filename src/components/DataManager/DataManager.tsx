import { type JSX, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconCircle,
  IconCircleCheck,
  IconExclamationCircle,
  IconSearch,
} from '@tabler/icons-react';
import {
  Box,
  Center,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { DataManagerButtonMenu } from './DataManagerButtonMenu';
import { ExportHeader } from '../ExportHeader/ExportHeader';
import classes from './DataManager.module.css';
import {
  useMatchSchedule,
  useTeamMatchValidation,
  type MatchScheduleEntry,
  type TeamMatchValidationStatus,
} from '@/api';
import {
  MatchScheduleToggle,
  type MatchScheduleSection,
} from '../MatchSchedule/MatchScheduleToggle';
import { SECTION_DEFINITIONS, groupMatchesBySection } from '../MatchSchedule/matchSections';

interface RowData {
  matchNumber: number;
  matchLevel: string;
  red1: number;
  red2: number;
  red3: number;
  blue1: number;
  blue2: number;
  blue3: number;
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

interface DataManagerProps {
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export function DataManager({ onSync, isSyncing = false }: DataManagerProps) {
  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();
  const {
    data: validationData = [],
    isLoading: isValidationLoading,
    isError: isValidationError,
  } = useTeamMatchValidation();
  const matchesBySection = useMemo(
    () => groupMatchesBySection(scheduleData),
    [scheduleData]
  );
  const availableSections = useMemo(
    () =>
      SECTION_DEFINITIONS.filter(
        (section) => matchesBySection[section.value].length > 0
      ),
    [matchesBySection]
  );
  const [activeSection, setActiveSection] = useState<MatchScheduleSection | undefined>();
  const [matchSearch, setMatchSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  useEffect(() => {
    if (availableSections.length === 0) {
      setActiveSection(undefined);
      return;
    }

    setActiveSection((current) => {
      if (current && availableSections.some((section) => section.value === current)) {
        return current;
      }

      return availableSections[0]?.value;
    });
  }, [availableSections]);

  const activeMatches: MatchScheduleEntry[] = activeSection
    ? matchesBySection[activeSection]
    : [];

  const schedule = useMemo<RowData[]>(
    () =>
      activeMatches.map((match) => ({
        matchNumber: match.match_number,
        matchLevel: match.match_level,
        red1: match.red1_id,
        red2: match.red2_id,
        red3: match.red3_id,
        blue1: match.blue1_id,
        blue2: match.blue2_id,
        blue3: match.blue3_id,
      })),
    [activeMatches]
  );

  const validationLookup = useMemo(() => {
    const entries = new Map<string, TeamMatchValidationStatus>();

    validationData.forEach((entry) => {
      entries.set(
        `${entry.match_level}-${entry.match_number}-${entry.team_number}`,
        entry.validation_status
      );
    });

    return entries;
  }, [validationData]);

  const wrapIcon = (icon: JSX.Element, label: string) => (
    <Box component="span" aria-label={label} role="img" title={label}>
      {icon}
    </Box>
  );

  const buildValidationIcon = (status?: TeamMatchValidationStatus) => {
    if (isValidationLoading) {
      return wrapIcon(<Loader size="md" color="gray-1" />, 'Loading validation status');
    }

    if (isValidationError) {
      return wrapIcon(
        <IconCircle size={20} color="var(--mantine-color-gray-5)" stroke={1.5} />,
        'Validation status unavailable'
      );
    }

    switch (status) {
      case 'PENDING':
        return wrapIcon(
          <IconCircle
            size={18}
            color="var(--mantine-color-dark-5)"
            stroke={1.5}
            style={{ fill: 'var(--mantine-color-yellow-5)' }}
          />,
          'Validation pending'
        );
      case 'NEEDS REVIEW':
        return wrapIcon(
          <IconExclamationCircle
            size={25}
            color="var(--mantine-color-orange-6)"
            stroke={1.5}
          />,
          'Needs review'
        );
      case 'VALID':
        return wrapIcon(
          <IconCircleCheck size={25} color="var(--mantine-color-green-6)" stroke={1.5} />,
          'Validated'
        );
      default:
        return wrapIcon(
          <IconCircle size={15} color="var(--mantine-color-gray-5)" stroke={1.5} />,
          'Validation status missing'
        );
    }
  };

  const renderTeamCell = (
    matchNumber: number,
    matchLevel: string,
    teamNumber: number,
    className: string
  ) => {
    const status = validationLookup.get(`${matchLevel}-${matchNumber}-${teamNumber}`);

    return (
      <Table.Td className={className}>
        <Group justify="center" align="center" gap="xs" wrap="nowrap">
          <Text>{teamNumber}</Text>
          {buildValidationIcon(status)}
        </Group>
      </Table.Td>
    );
  };

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
      {renderTeamCell(row.matchNumber, row.matchLevel, row.red1, classes.redCell)}
      {renderTeamCell(row.matchNumber, row.matchLevel, row.red2, classes.redCell)}
      {renderTeamCell(row.matchNumber, row.matchLevel, row.red3, classes.redCell)}
      {renderTeamCell(row.matchNumber, row.matchLevel, row.blue1, classes.blueCell)}
      {renderTeamCell(row.matchNumber, row.matchLevel, row.blue2, classes.blueCell)}
      {renderTeamCell(row.matchNumber, row.matchLevel, row.blue3, classes.blueCell)}
    </Table.Tr>
  ));

  const totalColumns = 1 + teamNumberKeys.length;

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
  } else if (!activeSection || availableSections.length === 0) {
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
        <ExportHeader onSync={onSync} isSyncing={isSyncing} />
      </Box>
      <ScrollArea>
        <Stack gap="md">
          {activeSection && availableSections.length > 0 ? (
            <MatchScheduleToggle
              value={activeSection}
              options={availableSections.map(({ label, value }) => ({ label, value }))}
              onChange={(section) => setActiveSection(section)}
            />
          ) : null}
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
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{tableBody}</Table.Tbody>
          </Table>
        </Stack>
      </ScrollArea>
    </>
  );
}
