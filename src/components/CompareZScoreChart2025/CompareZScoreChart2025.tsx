import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Card,
  Center,
  Loader,
  MultiSelect,
  Stack,
  Text,
  Title,
  rem,
  useMantineColorScheme,
  useMantineTheme,
  rgba,
} from '@mantine/core';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { useTeamZScores, type TeamZScoreResponseTeam } from '@/api';

const MIN_ATTRIBUTES = 3;
const MAX_ATTRIBUTES = 8;

type ZScoreAttributeKey =
  | 'autonomous_points_z'
  | 'teleop_points_z'
  | 'endgame_points_z'
  | 'game_piece_z'
  | 'total_points_z'
  | 'autonomous_level_4_coral_z'
  | 'autonomous_level_3_coral_z'
  | 'autonomous_level_2_coral_z'
  | 'autonomous_level_1_coral_z'
  | 'teleop_level_4_coral_z'
  | 'teleop_level_3_coral_z'
  | 'teleop_level_2_coral_z'
  | 'teleop_level_1_coral_z'
  | 'autonomous_net_z'
  | 'teleop_net_z'
  | 'autonomous_processor_z'
  | 'teleop_processor_z'
  | 'teleop_cycles_z';

type AttributeOption = {
  value: ZScoreAttributeKey;
  label: string;
  extremesKey: string;
};

const ATTRIBUTE_OPTIONS: AttributeOption[] = [
  { value: 'autonomous_points_z', label: 'Autonomous Points', extremesKey: 'autonomous_points_average' },
  { value: 'teleop_points_z', label: 'Teleop Points', extremesKey: 'teleop_points_average' },
  { value: 'endgame_points_z', label: 'Endgame Points', extremesKey: 'endgame_points_average' },
  { value: 'game_piece_z', label: 'Total Game Pieces', extremesKey: 'game_piece_average' },
  { value: 'total_points_z', label: 'Total Points', extremesKey: 'total_points_average' },
  {
    value: 'autonomous_level_4_coral_z',
    label: 'Auto L4 Coral',
    extremesKey: 'autonomous_level_4_coral_average',
  },
  {
    value: 'autonomous_level_3_coral_z',
    label: 'Auto L3 Coral',
    extremesKey: 'autonomous_level_3_coral_average',
  },
  {
    value: 'autonomous_level_2_coral_z',
    label: 'Auto L2 Coral',
    extremesKey: 'autonomous_level_2_coral_average',
  },
  {
    value: 'autonomous_level_1_coral_z',
    label: 'Auto L1 Coral',
    extremesKey: 'autonomous_level_1_coral_average',
  },
  {
    value: 'teleop_level_4_coral_z',
    label: 'Teleop L4 Coral',
    extremesKey: 'teleop_level_4_coral_average',
  },
  {
    value: 'teleop_level_3_coral_z',
    label: 'Teleop L3 Coral',
    extremesKey: 'teleop_level_3_coral_average',
  },
  {
    value: 'teleop_level_2_coral_z',
    label: 'Teleop L2 Coral',
    extremesKey: 'teleop_level_2_coral_average',
  },
  {
    value: 'teleop_level_1_coral_z',
    label: 'Teleop L1 Coral',
    extremesKey: 'teleop_level_1_coral_average',
  },
  { value: 'autonomous_net_z', label: 'Autonomous Net Algae', extremesKey: 'autonomous_net_average' },
  { value: 'teleop_net_z', label: 'Teleop Net Algae', extremesKey: 'teleop_net_average' },
  {
    value: 'autonomous_processor_z',
    label: 'Autonomous Processor Algae',
    extremesKey: 'autonomous_processor_average',
  },
  {
    value: 'teleop_processor_z',
    label: 'Teleop Processor Algae',
    extremesKey: 'teleop_processor_average',
  },
  { value: 'teleop_cycles_z', label: 'Teleop Cycles', extremesKey: 'teleop_cycles_average' },
];

const DEFAULT_ATTRIBUTE_SELECTION: ZScoreAttributeKey[] = [
  'autonomous_points_z',
  'endgame_points_z',
  'game_piece_z',
  'teleop_net_z',
  'teleop_processor_z',
  'teleop_cycles_z',
];

type CompareZScoreChart2025Props = {
  selectedTeams: string[];
};

type RadarDatum = {
  attribute: string;
  [teamKey: string]: number | string | undefined;
};

const getPalette = (colorScheme: 'dark' | 'light', theme: ReturnType<typeof useMantineTheme>) => {
  if (colorScheme === 'dark') {
    return [
      theme.colors.blue[4],
      theme.colors.orange[4],
      theme.colors.teal[3],
      theme.colors.red[4],
      theme.colors.grape[4],
    ];
  }

  return [
    theme.colors.blue[6],
    theme.colors.orange[5],
    theme.colors.teal[6],
    theme.colors.red[6],
    theme.colors.grape[5],
  ];
};

const getTeamKey = (team: TeamZScoreResponseTeam) => `team-${team.team_number}`;

export default function CompareZScoreChart2025({ selectedTeams }: CompareZScoreChart2025Props) {
  const theme = useMantineTheme();
  const { colorScheme: resolvedScheme } = useMantineColorScheme();
  const colorScheme = resolvedScheme === 'dark' ? 'dark' : 'light';

  const { data, isLoading, isError } = useTeamZScores();

  const [selectedAttributes, setSelectedAttributes] = useState<ZScoreAttributeKey[]>(() =>
    DEFAULT_ATTRIBUTE_SELECTION.filter((attribute) =>
      ATTRIBUTE_OPTIONS.some((option) => option.value === attribute),
    ),
  );
  const [attributeError, setAttributeError] = useState<string | null>(null);

  const attributeOptions = useMemo(() => ATTRIBUTE_OPTIONS, []);
  const attributeOptionMap = useMemo(() => {
    return new Map(attributeOptions.map((option) => [option.value, option]));
  }, [attributeOptions]);

  const palette = useMemo(() => getPalette(colorScheme, theme), [colorScheme, theme]);

  useEffect(() => {
    if (selectedAttributes.length >= MIN_ATTRIBUTES) {
      return;
    }

    const fallbackSelection = attributeOptions
      .slice(0, MIN_ATTRIBUTES)
      .map((option) => option.value);

    setSelectedAttributes(fallbackSelection);
  }, [attributeOptions, selectedAttributes]);

  const filteredTeams = useMemo(() => {
    if (!data) {
      return [] as TeamZScoreResponseTeam[];
    }

    const teamLookup = new Map(
      data.teams.map((team) => [String(team.team_number), team] as const),
    );

    return selectedTeams
      .map((teamId) => teamLookup.get(teamId))
      .filter((team): team is TeamZScoreResponseTeam => Boolean(team));
  }, [data, selectedTeams]);

  const domain = useMemo(() => {
    if (!data) {
      return [-3, 3] as [number, number];
    }

    const extremes = selectedAttributes
      .map((attribute) => attributeOptionMap.get(attribute)?.extremesKey)
      .map((extremesKey) => (extremesKey ? data.z_score_extremes[extremesKey] : undefined))
      .filter((item): item is { min: number; max: number } => Boolean(item));

    if (extremes.length === 0) {
      return [-3, 3] as [number, number];
    }

    const min = Math.min(...extremes.map((item) => item.min));
    const max = Math.max(...extremes.map((item) => item.max));

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
      return [-3, 3] as [number, number];
    }

    return [min, max] as [number, number];
  }, [attributeOptionMap, data, selectedAttributes]);

  const chartData = useMemo(() => {
    if (!data) {
      return [] as RadarDatum[];
    }

    return selectedAttributes
      .map((attribute) => attributeOptionMap.get(attribute))
      .filter((option): option is AttributeOption => Boolean(option))
      .map((option) => {
        const row: RadarDatum = {
          attribute: option.label,
        };

        filteredTeams.forEach((team) => {
          const teamKey = getTeamKey(team);
          const value = team[option.value];

          row[teamKey] = typeof value === 'number' ? value : undefined;
        });

        return row;
      });
  }, [attributeOptionMap, filteredTeams, selectedAttributes, data]);

  const handleAttributeChange = useCallback(
    (values: string[]) => {
      if (values.length < MIN_ATTRIBUTES) {
        setAttributeError(`Select at least ${MIN_ATTRIBUTES} attributes.`);
        return;
      }

      if (values.length > MAX_ATTRIBUTES) {
        return;
      }

      setAttributeError(null);
      setSelectedAttributes(values as ZScoreAttributeKey[]);
    },
    [],
  );

  const hasTeamsSelected = selectedTeams.length > 0;
  const hasChartData = chartData.length > 0 && filteredTeams.length > 0;
  const axisColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7];
  const legendTextColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[6];

  return (
    <Card withBorder p="lg" radius="lg" shadow="sm" h="100%">
      <Stack gap="lg" h="100%">
        <Stack gap={4}>
          <Title order={3}>Z-Score Comparison</Title>
          <Text size="sm" c="dimmed">
            Compare how selected teams stack up across key metrics.
          </Text>
        </Stack>

        <MultiSelect
          label="Attributes"
          data={attributeOptions}
          value={selectedAttributes}
          onChange={handleAttributeChange}
          searchable
          maxValues={MAX_ATTRIBUTES}
          comboboxProps={{ withinPortal: true }}
          error={attributeError ?? undefined}
          nothingFoundMessage="No attributes found"
          checkIconPosition="right"
        />

        <div style={{ flex: 1, minHeight: rem(320) }}>
          {isLoading ? (
            <Center h="100%">
              <Loader size="sm" />
            </Center>
          ) : isError ? (
            <Center h="100%">
              <Text c="dimmed">Unable to load z-score data at this time.</Text>
            </Center>
          ) : !hasTeamsSelected ? (
            <Center h="100%">
              <Text c="dimmed">Select teams to see their z-score comparison.</Text>
            </Center>
          ) : !hasChartData ? (
            <Center h="100%">
              <Text c="dimmed">No z-score data is available for the selected teams.</Text>
            </Center>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke={rgba(axisColor, colorScheme === 'dark' ? 0.4 : 0.5)} />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: axisColor }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={domain}
                  tick={{ fill: axisColor }}
                  tickFormatter={(value: number) => value.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
                    borderColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
                    borderRadius: theme.radius.md,
                    color: colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[6],
                  }}
                  formatter={(value: number | string | undefined, name: string) => [
                    typeof value === 'number' ? value.toFixed(2) : 'N/A',
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  wrapperStyle={{ color: legendTextColor }}
                  iconType="circle"
                />
                {filteredTeams.map((team, index) => {
                  const color = palette[index % palette.length];
                  const teamKey = getTeamKey(team);
                  const displayName = team.team_name
                    ? `${team.team_number} • ${team.team_name}`
                    : `Team ${team.team_number}`;

                  return (
                    <Radar
                      key={teamKey}
                      name={displayName}
                      dataKey={teamKey}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.25}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Stack>
    </Card>
  );
}
