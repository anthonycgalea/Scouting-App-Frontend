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
  useScoutMatchesData,
  useTeamMatchValidation,
  useEventTbaMatchDataset,
  type MatchScheduleEntry,
  type TeamMatchData,
  type TeamMatchValidationStatus,
} from '@/api';
import {
  MatchScheduleToggle,
  type MatchScheduleSection,
} from '../MatchSchedule/MatchScheduleToggle';
import { SECTION_DEFINITIONS, groupMatchesBySection } from '../MatchSchedule/matchSections';
import type { MatchValidationNumericField } from '../MatchValidation/matchValidation.config';
import {
  ENDGAME_LABELS,
  extractTbaTeamEntries,
  createScoutMatchLookup,
  createTbaAllianceLookup,
  formatEndgameValue,
  getAllianceNumericValue,
  getAllianceTotalsRecord,
  getTeamMatchData,
  findScoutMatchRecordInLookup,
  findTbaAllianceRecordInLookup,
  isValidTeamNumber,
  parseNumericValue,
  type TbaTeamEntry,
  type ScoutMatchLookup,
  type TbaAllianceLookup,
} from '../MatchValidation/matchDataUtils';

interface RowData {
  matchNumber: number;
  matchLevel: string;
  season?: number;
  red1: number;
  red2: number;
  red3: number;
  blue1: number;
  blue2: number;
  blue3: number;
}

type AllianceMetricField = Extract<
  MatchValidationNumericField,
  'al4c' | 'al3c' | 'al2c' | 'al1c' | 'tl4c' | 'tl3c' | 'tl2c' | 'tl1c'
>;

const AUTO_CORAL_FIELDS = ['al4c', 'al3c', 'al2c', 'al1c'] as const satisfies readonly AllianceMetricField[];
const TELEOP_CORAL_FIELDS = ['tl4c', 'tl3c', 'tl2c', 'tl1c'] as const satisfies readonly AllianceMetricField[];

type AllianceColor = 'RED' | 'BLUE';
type AllianceKey = `${string}-${AllianceColor}`;

interface NumericComparison {
  total: number | null;
  tbaTotal: number | null;
  difference: number | null;
}

type EndgameComparison = 'MATCH' | 'MISMATCH' | 'UNKNOWN';

interface AllianceSummary {
  metrics: {
    autoCoral: NumericComparison;
    teleopCoral: NumericComparison;
  };
  endgame: EndgameComparison[];
  hasError: boolean;
}

interface MatchAllianceInput {
  matchLevel: string;
  matchNumber: number;
  red: number[];
  blue: number[];
}

type AllianceSummaryMap = Map<AllianceKey, AllianceSummary>;

const buildAllianceKey = (
  matchLevel: string | null | undefined,
  matchNumber: number,
  alliance: AllianceColor
): AllianceKey => `${(matchLevel ?? '').toLowerCase()}-${matchNumber}-${alliance}`;

const sumScoutFields = (
  teamData: Array<Partial<TeamMatchData> | undefined>,
  fields: readonly AllianceMetricField[]
) => {
  let hasValue = false;
  let total = 0;

  teamData.forEach((data) => {
    if (!data) {
      return;
    }

    fields.forEach((field) => {
      const value = data[field];

      if (typeof value === 'number' && Number.isFinite(value)) {
        total += value;
        hasValue = true;
      }
    });
  });

  return hasValue ? total : null;
};

const sumTbaFields = (
  entries: TbaTeamEntry[],
  totalsRecord: Record<string, unknown> | undefined,
  fields: readonly AllianceMetricField[]
) => {
  if (totalsRecord) {
    let totalsSum = 0;
    let hasValue = false;

    fields.forEach((field) => {
      const value = getAllianceNumericValue(totalsRecord, field);

      if (value !== undefined) {
        totalsSum += value;
        hasValue = true;
      }
    });

    if (hasValue) {
      return totalsSum;
    }
  }

  let entrySum = 0;
  let hasEntryValue = false;

  entries.forEach((entry) => {
    fields.forEach((field) => {
      const value = parseNumericValue(entry.data[field]);

      if (value !== undefined) {
        entrySum += value;
        hasEntryValue = true;
      }
    });
  });

  return hasEntryValue ? entrySum : null;
};

const computeNumericComparison = (
  teamData: Array<Partial<TeamMatchData> | undefined>,
  tbaEntries: TbaTeamEntry[],
  tbaTotalsRecord: Record<string, unknown> | undefined,
  fields: readonly AllianceMetricField[]
): NumericComparison => {
  const total = sumScoutFields(teamData, fields);
  const tbaTotal = sumTbaFields(tbaEntries, tbaTotalsRecord, fields);
  const difference =
    total !== null && tbaTotal !== null ? Math.round((total - tbaTotal) * 100) / 100 : null;

  return { total, tbaTotal, difference };
};

const buildAllianceEndgameKeys = (alliance: AllianceColor, index: number) => {
  const slot = index + 1;
  const lowerAlliance = alliance.toLowerCase();
  const capitalizedAlliance = `${alliance.charAt(0)}${alliance.slice(1).toLowerCase()}`;

  return [
    `${lowerAlliance}_${slot}_endgame`,
    `${lowerAlliance}_${slot}_Endgame`,
    `${lowerAlliance}${slot}_endgame`,
    `${lowerAlliance}${slot}Endgame`,
    `${lowerAlliance}${slot}endgame`,
    `${capitalizedAlliance}${slot}Endgame`,
    `${capitalizedAlliance}${slot}endgame`,
    `${capitalizedAlliance}_${slot}_endgame`,
    `${capitalizedAlliance}_${slot}_Endgame`,
  ];
};

const buildBotEndgameKeys = (index: number) => {
  const slot = index + 1;

  return [
    `bot_${slot}_endgame`,
    `bot_${slot}_Endgame`,
    `bot${slot}_endgame`,
    `bot${slot}_Endgame`,
    `bot${slot}endgame`,
    `bot${slot}Endgame`,
  ];
};

const extractEndgameLabel = (
  sources: Array<Record<string, unknown> | undefined>,
  keys: string[]
) => {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const key of keys) {
      if (!(key in source)) {
        continue;
      }

      const label = formatEndgameValue(source[key]);

      if (label) {
        return label;
      }
    }
  }

  return undefined;
};

const computeEndgameStatuses = (
  alliance: AllianceColor,
  teamNumbers: number[],
  teamData: Array<Partial<TeamMatchData> | undefined>,
  tbaEndgameMap: Map<number, string>,
  tbaTotalsRecord: Record<string, unknown> | undefined,
  tbaRecord: Record<string, unknown> | undefined
): EndgameComparison[] =>
  teamNumbers.map((teamNumber, index) => {
    const allianceLabel = extractEndgameLabel(
      [tbaTotalsRecord, tbaRecord],
      buildAllianceEndgameKeys(alliance, index)
    );
    const botLabel = extractEndgameLabel(
      [tbaTotalsRecord, tbaRecord],
      buildBotEndgameKeys(index)
    );

    if (allianceLabel || botLabel) {
      if (!allianceLabel || !botLabel) {
        return 'UNKNOWN';
      }

      return allianceLabel === botLabel ? 'MATCH' : 'MISMATCH';
    }

    if (!isValidTeamNumber(teamNumber)) {
      return 'UNKNOWN';
    }

    const data = teamData[index];
    const scoutLabel = data?.endgame ? ENDGAME_LABELS[data.endgame] : undefined;
    const tbaLabel = tbaEndgameMap.get(teamNumber);

    if (!scoutLabel && !tbaLabel) {
      return 'UNKNOWN';
    }

    if (!scoutLabel || !tbaLabel) {
      return 'UNKNOWN';
    }

    return scoutLabel === tbaLabel ? 'MATCH' : 'MISMATCH';
  });

const buildAllianceSummary = (
  {
    matchLevel,
    matchNumber,
    alliance,
    teamNumbers,
  }: {
    matchLevel: string;
    matchNumber: number;
    alliance: AllianceColor;
    teamNumbers: number[];
  },
  scoutLookup: ScoutMatchLookup,
  tbaLookup: TbaAllianceLookup,
  scoutError: boolean,
  tbaError: boolean
): AllianceSummary => {
  const teamData = teamNumbers.map((teamNumber) => {
    if (!isValidTeamNumber(teamNumber)) {
      return undefined;
    }

    const record = findScoutMatchRecordInLookup(scoutLookup, {
      matchLevel,
      matchNumber,
      teamNumber,
    });

    return record ? getTeamMatchData(record) ?? undefined : undefined;
  });

  const tbaRecord = findTbaAllianceRecordInLookup(tbaLookup, {
    matchLevel,
    matchNumber,
    alliance,
  });

  const tbaTotalsRecord = getAllianceTotalsRecord(tbaRecord);
  const validTeamNumbers = teamNumbers.filter((teamNumber) => isValidTeamNumber(teamNumber));
  const teamSet = new Set(validTeamNumbers);
  const tbaEntries = tbaRecord
    ? extractTbaTeamEntries(tbaRecord).filter((entry) => teamSet.has(entry.teamNumber))
    : [];
  const tbaEndgameMap = new Map<number, string>();

  tbaEntries.forEach((entry) => {
    const label = formatEndgameValue(entry.data.endgame);

    if (label) {
      tbaEndgameMap.set(entry.teamNumber, label);
    }
  });

  const autoCoral = computeNumericComparison(teamData, tbaEntries, tbaTotalsRecord, AUTO_CORAL_FIELDS);
  const teleopCoral = computeNumericComparison(
    teamData,
    tbaEntries,
    tbaTotalsRecord,
    TELEOP_CORAL_FIELDS
  );
  const endgame = computeEndgameStatuses(
    alliance,
    teamNumbers,
    teamData,
    tbaEndgameMap,
    tbaTotalsRecord,
    tbaRecord
  );

  return {
    metrics: { autoCoral, teleopCoral },
    endgame,
    hasError: scoutError || tbaError,
  };
};

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
  const {
    data: scoutMatchesResponse,
    isLoading: isScoutMatchesLoading,
    isError: isScoutMatchesError,
  } = useScoutMatchesData();
  const {
    data: tbaMatchDataResponse,
    isLoading: isTbaMatchDataLoading,
    isError: isTbaMatchDataError,
  } = useEventTbaMatchDataset();
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
        season: match.season,
        red1: match.red1_id,
        red2: match.red2_id,
        red3: match.red3_id,
        blue1: match.blue1_id,
        blue2: match.blue2_id,
        blue3: match.blue3_id,
      })),
    [activeMatches]
  );

  const allianceQueryInputs = useMemo<MatchAllianceInput[]>(
    () =>
      scheduleData.map((match) => ({
        matchLevel: match.match_level,
        matchNumber: match.match_number,
        red: [match.red1_id, match.red2_id, match.red3_id],
        blue: [match.blue1_id, match.blue2_id, match.blue3_id],
      })),
    [scheduleData]
  );

  const scoutLookup = useMemo(
    () => createScoutMatchLookup(scoutMatchesResponse),
    [scoutMatchesResponse]
  );

  const tbaLookup = useMemo(
    () => createTbaAllianceLookup(tbaMatchDataResponse),
    [tbaMatchDataResponse]
  );

  const isAllianceSummaryLoading =
    isScoutMatchesLoading || isTbaMatchDataLoading;

  const allianceSummaryMap = useMemo<AllianceSummaryMap>(() => {
    if (allianceQueryInputs.length === 0) {
      return new Map();
    }

    const summaries: AllianceSummaryMap = new Map();

    allianceQueryInputs.forEach((match) => {
      const redSummary = buildAllianceSummary(
        {
          matchLevel: match.matchLevel,
          matchNumber: match.matchNumber,
          alliance: 'RED',
          teamNumbers: match.red,
        },
        scoutLookup,
        tbaLookup,
        Boolean(isScoutMatchesError),
        Boolean(isTbaMatchDataError)
      );

      const blueSummary = buildAllianceSummary(
        {
          matchLevel: match.matchLevel,
          matchNumber: match.matchNumber,
          alliance: 'BLUE',
          teamNumbers: match.blue,
        },
        scoutLookup,
        tbaLookup,
        Boolean(isScoutMatchesError),
        Boolean(isTbaMatchDataError)
      );

      summaries.set(
        buildAllianceKey(match.matchLevel, match.matchNumber, 'RED'),
        redSummary
      );
      summaries.set(
        buildAllianceKey(match.matchLevel, match.matchNumber, 'BLUE'),
        blueSummary
      );
    });

    return summaries;
  }, [
    allianceQueryInputs,
    scoutLookup,
    tbaLookup,
    isScoutMatchesError,
    isTbaMatchDataError,
  ]);

  const isInitialSummaryLoading =
    isAllianceSummaryLoading && allianceSummaryMap.size === 0;

  const shouldShow2025Columns = (season?: number) => season === undefined || season === 2025;

  const renderAllianceMetricCell = (
    summary: AllianceSummary | undefined,
    metric: keyof AllianceSummary['metrics'],
    season?: number
  ) => {
    if (!shouldShow2025Columns(season)) {
      return <Table.Td>—</Table.Td>;
    }

    if (isInitialSummaryLoading) {
      return (
        <Table.Td>
          <Center>
            <Loader size="sm" />
          </Center>
        </Table.Td>
      );
    }

    if (!summary) {
      return <Table.Td>—</Table.Td>;
    }

    const { total, tbaTotal, difference } = summary.metrics[metric];

    if (total === null && tbaTotal === null) {
      return <Table.Td>—</Table.Td>;
    }

    const tooltipMessages: string[] = [];

    if (summary.hasError) {
      tooltipMessages.push(
        'Some alliance metrics could not be retrieved. Values may be incomplete.'
      );
    }

    if (total !== null) {
      tooltipMessages.push(`Scouting total: ${total}`);
    }

    if (tbaTotal !== null) {
      tooltipMessages.push(`TBA total: ${tbaTotal}`);
    }

    let diffText: string | undefined;
    if (difference !== null) {
      diffText = `${difference > 0 ? '+' : ''}${difference}`;
      tooltipMessages.push(`Δ ${diffText}`);
    }

    const title = tooltipMessages.length > 0 ? tooltipMessages.join('\n') : undefined;

    const hasMismatch = difference !== null && difference !== 0;
    const cellClass = hasMismatch
      ? `${classes.numericCell} ${classes.numericMismatch}`
      : classes.numericCell;

    //const primaryColor = hasMismatch ? 'red.6' : total === null ? 'dimmed' : undefined;
    const secondaryColor =
      difference === null ? undefined : difference === 0 ? 'green.6' : 'red.6';

    return (
      <Table.Td className={cellClass} title={title}>
        {diffText !== undefined && (
          <Text fz="xs" c={secondaryColor}>
            Δ {diffText}
          </Text>
        )}
      </Table.Td>
    );
  };

  const renderAllianceEndgameCell = (
    summary: AllianceSummary | undefined,
    index: number,
    season?: number
  ) => {
    if (!shouldShow2025Columns(season)) {
      return <Table.Td>—</Table.Td>;
    }

    if (isInitialSummaryLoading) {
      return (
        <Table.Td>
          <Center>
            <Loader size="sm" />
          </Center>
        </Table.Td>
      );
    }

    if (!summary) {
      return <Table.Td>—</Table.Td>;
    }

    const status = summary.endgame[index] ?? 'UNKNOWN';
    const title = summary.hasError
      ? 'Some alliance metrics could not be retrieved. Values may be incomplete.'
      : undefined;

    if (status === 'MATCH') {
      return (
        <Table.Td className={classes.endgameMatch} title={title}>
          ✓
        </Table.Td>
      );
    }

    if (status === 'MISMATCH') {
      return (
        <Table.Td className={classes.endgameMismatch} title={title}>
          ✗
        </Table.Td>
      );
    }

    return (
      <Table.Td title={title}>
        —
      </Table.Td>
    );
  };

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
    const redSummary = allianceSummaryMap.get(
      buildAllianceKey(row.matchLevel, row.matchNumber, 'RED')
    );
    const blueSummary = allianceSummaryMap.get(
      buildAllianceKey(row.matchLevel, row.matchNumber, 'BLUE')
    );

    const redRow = (
      <Table.Tr key={`red-${row.matchNumber}`}>
        <Table.Td rowSpan={2}>
          <DataManagerButtonMenu matchNumber={row.matchNumber} />
        </Table.Td>
        <Table.Td className={classes.redCell}>Red</Table.Td>
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red1)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red2)}
        {renderTeamCell(row.matchNumber, row.matchLevel, row.red3)}
        {renderAllianceMetricCell(redSummary, 'autoCoral', row.season)}
        {renderAllianceMetricCell(redSummary, 'teleopCoral', row.season)}
        {renderAllianceEndgameCell(redSummary, 0, row.season)}
        {renderAllianceEndgameCell(redSummary, 1, row.season)}
        {renderAllianceEndgameCell(redSummary, 2, row.season)}
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
        {renderAllianceMetricCell(blueSummary, 'autoCoral', row.season)}
        {renderAllianceMetricCell(blueSummary, 'teleopCoral', row.season)}
        {renderAllianceEndgameCell(blueSummary, 0, row.season)}
        {renderAllianceEndgameCell(blueSummary, 1, row.season)}
        {renderAllianceEndgameCell(blueSummary, 2, row.season)}
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

  const totalColumns = 11;

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
        <ExportHeader
          onSync={onSync}
          isSyncing={isSyncing}
          showDownloadButton={false}
        />
      </Box>
      <Box className={classes.content}>
        {activeSection && availableSections.length > 0 ? (
          <Box className={classes.scheduleControls}>
            <MatchScheduleToggle
              value={activeSection}
              options={availableSections.map(({ label, value }) => ({ label, value }))}
              onChange={(section) => setActiveSection(section)}
            />
          </Box>
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
              miw={1000}
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
                  <Table.Th>Auto Coral</Table.Th>
                  <Table.Th>Teleop Coral</Table.Th>
                  <Table.Th>Robot 1 Endgame</Table.Th>
                  <Table.Th>Robot 2 Endgame</Table.Th>
                  <Table.Th>Robot 3 Endgame</Table.Th>
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
