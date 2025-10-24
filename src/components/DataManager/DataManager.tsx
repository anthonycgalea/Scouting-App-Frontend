import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import {
  Box,
  Button,
  Center,
  Group,
  Loader,
  ScrollArea,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
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

const buildValidationKey = (
  matchLevel: string | null | undefined,
  matchNumber: number,
  teamNumber: number
) => `${(matchLevel ?? '').toLowerCase()}-${matchNumber}-${teamNumber}`;

const buildMatchKey = (matchLevel: string | null | undefined, matchNumber: number) =>
  `${(matchLevel ?? '').toLowerCase()}-${matchNumber}`;

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

interface DataManagerProps {
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export function DataManager({ onSync, isSyncing = false }: DataManagerProps) {
  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();
  const { data: validationData = [] } = useTeamMatchValidation();
  const navigate = useNavigate();
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
        buildValidationKey(entry.match_level, entry.match_number, entry.team_number),
        entry.validation_status
      );
    });

    return entries;
  }, [validationData]);

  const matchValidationLookup = useMemo(() => {
    const entries = new Map<string, Set<number>>();

    validationData.forEach((entry) => {
      const matchKey = buildMatchKey(entry.match_level, entry.match_number);
      const teamsWithRecords = entries.get(matchKey) ?? new Set<number>();
      teamsWithRecords.add(entry.team_number);
      entries.set(matchKey, teamsWithRecords);
    });

    return entries;
  }, [validationData]);

  const renderTeamCell = (matchNumber: number, matchLevel: string, teamNumber: number) => {
    const matchKey = buildMatchKey(matchLevel, matchNumber);
    const teamsWithRecords = matchValidationLookup.get(matchKey);
    const hasRecord = teamsWithRecords?.has(teamNumber) ?? false;
    const hasAnyRecord = (teamsWithRecords?.size ?? 0) > 0;
    const classNames = [classes.teamCell];

    if (hasRecord) {
      classNames.push(classes.teamCellValidated);
    } else if (hasAnyRecord) {
      classNames.push(classes.teamCellMissing);
    }

    return (
      <Table.Td className={classNames.join(' ')}>
        <Text ta="center">{teamNumber}</Text>
      </Table.Td>
    );
  };

  const sortedData = useMemo(() => {
    const matches = [...schedule];
    matches.sort((a, b) =>
      reverseSortDirection ? b.matchNumber - a.matchNumber : a.matchNumber - b.matchNumber
    );
    return matches;
  }, [schedule, reverseSortDirection]);

  const setSorting = () => {
    setReverseSortDirection((current) => !current);
  };

  const renderAllianceButton = (
    matchNumber: number,
    matchLevel: string,
    alliance: 'RED' | 'BLUE',
    teamNumbers: [number, number, number],
    className?: string
  ) => {
    const statuses = teamNumbers.map((teamNumber) =>
      validationLookup.get(buildValidationKey(matchLevel, matchNumber, teamNumber))
    );

    const hasPending = statuses.some((status) => status === 'PENDING');
    const hasMissingRecord = statuses.some((status) => status === undefined);
    const allValid =
      statuses.length > 0 && statuses.every((status) => status === 'VALID');
    const isDisabled = hasPending || hasMissingRecord || allValid;

    return (
      <Table.Td className={className}>
        <Button
          onClick={() =>
            navigate({
              to: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance',
              params: () => ({
                matchLevel: String(matchLevel ?? ''),
                matchNumber: String(matchNumber),
                alliance: alliance.toLowerCase(),
              }),
            })
          }
          size="xs"
          variant="light"
          color={alliance === 'RED' ? 'red' : undefined}
          disabled={isDisabled}
        >
          Validate
        </Button>
      </Table.Td>
    );
  };

  const rows = sortedData.flatMap((row) => {
    const redRow = (
      <Table.Tr key={`red-${row.matchNumber}`}>
        <Table.Td rowSpan={2}>
          <DataManagerButtonMenu matchNumber={row.matchNumber} />
        </Table.Td>
        <Table.Td className={classes.redCell}>Red</Table.Td>
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red1)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red2)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red3)}
        {renderAllianceButton(
          row.matchNumber,
          row.matchLevel,
          'RED',
          [row.red1, row.red2, row.red3],
          undefined
        )}
      </Table.Tr>
    );

    const blueRow = (
      <Table.Tr key={`blue-${row.matchNumber}`}>
        <Table.Td className={classes.blueCell}>Blue</Table.Td>
        {renderTeamCell(row.matchNumber, row.matchLevel, row.blue1)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.blue2)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.blue3)}
        {renderAllianceButton(
          row.matchNumber,
          row.matchLevel,
          'BLUE',
          [row.blue1, row.blue2, row.blue3],
          undefined
        )}
      </Table.Tr>
    );

    return [redRow, blueRow];
  });

  const totalColumns = 6;

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
    <Box className={classes.container}>
      <Box className={classes.header}>
        <ExportHeader onSync={onSync} isSyncing={isSyncing} />
      </Box>
      <Box className={classes.content}>
        {activeSection && availableSections.length > 0 ? (
          <MatchScheduleToggle
            value={activeSection}
            options={availableSections.map(({ label, value }) => ({ label, value }))}
            onChange={(section) => setActiveSection(section)}
          />
        ) : null}
        <ScrollArea
          type="always"
          offsetScrollbars
          scrollbarSize={12}
          className={classes.scheduleScrollArea}
          classNames={{ viewport: classes.scrollViewport }}
        >
          <Box className={classes.scheduleContent}>
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
                  <Table.Th>Alliance</Table.Th>
                  <Table.Th>Team 1</Table.Th>
                  <Table.Th>Team 2</Table.Th>
                  <Table.Th>Team 3</Table.Th>
                  <Table.Th>Validate</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{tableBody}</Table.Tbody>
            </Table>
          </Box>
        </ScrollArea>
      </Box>
    </Box>
  );
}
