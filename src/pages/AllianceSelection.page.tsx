import { useEffect, useMemo, useState } from 'react';

import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Loader,
  Menu,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Switch,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  useMantineTheme,
  rgba,
  useMantineColorScheme,
} from '@mantine/core';
import { IconRefresh, IconSettings } from '@tabler/icons-react';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';
import { syncEventRankings, useEventRankings } from '@/api';
import { useOrganizationEvents } from '@/api/events';
import { usePickLists } from '@/api/pickLists';
import { useEventTeams } from '@/api/teams';
import { PickListPreview } from '@/components/PickLists/PickListPreview';

type AllianceEntry = {
  captain: string;
  firstPick: string;
  secondPick: string;
  thirdPick: string;
};

const DEFAULT_ALLIANCE_COUNT = 8;

const createAllianceEntries = (count: number): AllianceEntry[] =>
  Array.from({ length: count }, () => ({
    captain: '',
    firstPick: '',
    secondPick: '',
    thirdPick: '',
  }));

export function AllianceSelectionPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const theme = useMantineTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allianceEntries, setAllianceEntries] = useState<AllianceEntry[]>(() =>
    createAllianceEntries(DEFAULT_ALLIANCE_COUNT),
  );
  const [includeThirdPicks, setIncludeThirdPicks] = useState(false);
  const [allianceCount, setAllianceCount] = useState<number>(DEFAULT_ALLIANCE_COUNT);
  const [selectedPickListId, setSelectedPickListId] = useState<string | null>(null);
  const { data: rankings, isLoading, isError } = useEventRankings({
    enabled: canAccessOrganizationPages && !isCheckingAccess,
  });
  const { data: organizationEvents, isLoading: isLoadingEvents } = useOrganizationEvents({
    enabled: canAccessOrganizationPages && !isCheckingAccess,
  });
  const { data: pickLists, isLoading: isLoadingPickLists } = usePickLists({
    enabled: canAccessOrganizationPages && !isCheckingAccess,
  });

  const activeEvent = useMemo(
    () => organizationEvents?.find((event) => event.isActive) ?? null,
    [organizationEvents],
  );
  const { data: eventTeams = [], isLoading: isLoadingEventTeams } = useEventTeams(
    activeEvent?.eventKey ?? '2025micmp4',
    {
      enabled: Boolean(activeEvent),
    },
  );

  const pickListsForActiveEvent = useMemo(() => {
    if (!pickLists) {
      return [];
    }

    if (!activeEvent) {
      return pickLists;
    }

    return pickLists.filter((list) => list.event_key === activeEvent.eventKey);
  }, [activeEvent, pickLists]);

  const sortedPickLists = useMemo(() => {
    return [...pickListsForActiveEvent].sort((first, second) => {
      if (first.favorited !== second.favorited) {
        return first.favorited ? -1 : 1;
      }

      return (
        new Date(second.last_updated).getTime() - new Date(first.last_updated).getTime()
      );
    });
  }, [pickListsForActiveEvent]);

  useEffect(() => {
    if (sortedPickLists.length === 0) {
      setSelectedPickListId(null);
      return;
    }

    setSelectedPickListId((current) => {
      if (current && sortedPickLists.some((list) => list.id === current)) {
        return current;
      }

      return sortedPickLists[0]?.id ?? null;
    });
  }, [sortedPickLists]);

  const selectedPickList = useMemo(
    () => sortedPickLists.find((list) => list.id === selectedPickListId) ?? null,
    [selectedPickListId, sortedPickLists],
  );

  const eventTeamsByNumber = useMemo(
    () =>
      new Map(eventTeams.map((team) => [team.team_number, team])),
    [eventTeams],
  );

  const pickListSelectOptions = useMemo(
    () => sortedPickLists.map((list) => ({ value: list.id, label: list.title })),
    [sortedPickLists],
  );

  const selectedPickListRanks = selectedPickList?.ranks ?? [];

  const isPickListPanelLoading =
    isLoadingPickLists || isLoadingEvents || (Boolean(activeEvent) && isLoadingEventTeams);

  const handleRefreshRankings = async () => {
    try {
      setIsRefreshing(true);
      await syncEventRankings();
      window.location.reload();
    } catch (error) {
      setIsRefreshing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to refresh event rankings', error);
    }
  };

  const handleAllianceEntryChange = (
    index: number,
    field: keyof AllianceEntry,
    value: string,
  ) => {
    setAllianceEntries((previous) => {
      const updated = [...previous];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAllianceCountChange = (value: string | number) => {
    if (value === '' || value === null) {
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue < 1) {
      return;
    }

    setAllianceCount(numericValue);
    setAllianceEntries((previous) => {
      if (numericValue > previous.length) {
        return [
          ...previous,
          ...createAllianceEntries(numericValue - previous.length),
        ];
      }

      return previous.slice(0, numericValue);
    });
  };

  const selectedTeams = useMemo(() => {
    const selections = new Set<string>();

    allianceEntries.forEach((entry) => {
      const fields: Array<keyof AllianceEntry> = ['captain', 'firstPick', 'secondPick'];
      if (includeThirdPicks) {
        fields.push('thirdPick');
      }

      fields.forEach((field) => {
        const trimmedValue = entry[field]?.trim();
        if (trimmedValue) {
          selections.add(trimmedValue);
        }
      });
    });

    return selections;
  }, [allianceEntries, includeThirdPicks]);

  const filteredRankings = useMemo(() => {
    if (!rankings) {
      return [];
    }

    return rankings.filter((ranking) => !selectedTeams.has(String(ranking.team_number)));
  }, [rankings, selectedTeams]);

  const captainHighlightColor =
    useMantineColorScheme().colorScheme === 'dark'
      ? rgba(theme.colors.green[2], 0.2)
      : theme.colors.yellow[1];

  const captainSpotsFilled = useMemo(
    () =>
      allianceEntries.reduce((count, entry) => {
        const hasCaptain = entry.captain.trim().length > 0;
        return hasCaptain ? count + 1 : count;
      }, 0),
    [allianceEntries],
  );

  const remainingCaptainSpots = Math.max(allianceCount - captainSpotsFilled, 0);

  const captainCandidateTeams = useMemo(() => {
    if (remainingCaptainSpots === 0) {
      return new Set<string>();
    }

    return new Set(
      filteredRankings
        .slice(0, remainingCaptainSpots)
        .map((ranking) => String(ranking.team_number)),
    );
  }, [filteredRankings, remainingCaptainSpots]);

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md" style={{ height: '100%' }}>
      <Flex direction="column" gap="lg" style={{ height: '100%' }}>
        <Group justify="center" align="center" gap="sm">
          <Title order={2}>Alliance Selection</Title>
          <ActionIcon
            aria-label="Refresh event rankings"
            size="lg"
            radius="md"
            variant="default"
            style={{ backgroundColor: 'var(--mantine-color-body)' }}
            onClick={handleRefreshRankings}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader size="sm" /> : <IconRefresh size={20} />}
          </ActionIcon>
          <Menu withinPortal position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon
                aria-label="Alliance selection settings"
                size="lg"
                radius="md"
                variant="default"
                style={{ backgroundColor: 'var(--mantine-color-body)' }}
              >
                <IconSettings size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Alliance options</Menu.Label>
              <Menu.Item closeMenuOnClick={false}>
                <Group justify="space-between" align="center">
                  <Text size="sm">Third Picks</Text>
                  <Switch
                    size="sm"
                    checked={includeThirdPicks}
                    onChange={(event) => setIncludeThirdPicks(event.currentTarget.checked)}
                    aria-label={includeThirdPicks ? 'Disable third picks' : 'Enable third picks'}
                  />
                </Group>
              </Menu.Item>
              <Menu.Item closeMenuOnClick={false}>
                <NumberInput
                  label="Number of alliances"
                  size="sm"
                  min={1}
                  max={16}
                  value={allianceCount}
                  onChange={handleAllianceCountChange}
                  clampBehavior="strict"
                  styles={{ label: { marginBottom: 'var(--mantine-spacing-xs)' } }}
                />
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap="lg"
          align="stretch"
          style={{ flex: 1, minHeight: 0 }}
        >
          <Paper
            withBorder
            radius="md"
            p="md"
            w={{ base: '100%', md: 'auto' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '3 1 0%',
              minWidth: 0,
            }}
          >
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Event Rankings</Title>
              {isLoading ? (
                <Group justify="center">
                  <Loader aria-label="Loading event rankings" />
                </Group>
              ) : isError ? (
                <Text c="red">Unable to load event rankings.</Text>
              ) : rankings && rankings.length > 0 ? (
                filteredRankings.length > 0 ? (
                <ScrollArea type="auto" style={{ flex: 1 }}>
                  <Table striped highlightOnHover stickyHeader>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Team</Table.Th>
                        <Table.Th>Name</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredRankings.map((ranking) => {
                        const isCaptainCandidate = captainCandidateTeams.has(
                          String(ranking.team_number),
                        );

                        return (
                          <Table.Tr
                            key={`${ranking.event_key}-${ranking.team_number}-${ranking.rank}`}
                            style={
                              isCaptainCandidate
                                ? { backgroundColor: captainHighlightColor }
                                : undefined
                            }
                          >
                            <Table.Td>{ranking.rank}</Table.Td>
                            <Table.Td>{ranking.team_number}</Table.Td>
                            <Table.Td>{ranking.team_name?.trim() || '—'}</Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
                ) : (
                  <Text c="dimmed">All ranked teams are currently allocated.</Text>
                )
              ) : (
                <Text c="dimmed">No rankings available.</Text>
              )}
            </Stack>
          </Paper>
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ flex: '5 1 0%', display: 'flex', minWidth: 0 }}
          >
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Group justify="space-between" align="center">
                <Title order={4}>Alliance Selection</Title>
                <Text size="sm" c="dimmed">
                  {includeThirdPicks ? 'Captains, first, second, and third picks' : 'Captains, first and second picks'}
                </Text>
              </Group>
              <ScrollArea style={{ flex: 1 }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Alliance</Table.Th>
                      <Table.Th>Captain</Table.Th>
                      <Table.Th>First Pick</Table.Th>
                      <Table.Th>Second Pick</Table.Th>
                      {includeThirdPicks ? <Table.Th>Third Pick</Table.Th> : null}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {allianceEntries.map((entry, index) => (
                      <Table.Tr key={`alliance-${index}`}>
                        <Table.Td>
                          <Text fw={600}>Alliance {index + 1}</Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Alliance ${index + 1} captain`}
                            placeholder="Team number"
                            value={entry.captain}
                            onChange={(event) =>
                              handleAllianceEntryChange(index, 'captain', event.currentTarget.value)
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Alliance ${index + 1} first pick`}
                            placeholder="Team number"
                            value={entry.firstPick}
                            onChange={(event) =>
                              handleAllianceEntryChange(index, 'firstPick', event.currentTarget.value)
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            aria-label={`Alliance ${index + 1} second pick`}
                            placeholder="Team number"
                            value={entry.secondPick}
                            onChange={(event) =>
                              handleAllianceEntryChange(index, 'secondPick', event.currentTarget.value)
                            }
                          />
                        </Table.Td>
                        {includeThirdPicks ? (
                          <Table.Td>
                            <TextInput
                              aria-label={`Alliance ${index + 1} third pick`}
                              placeholder="Team number"
                              value={entry.thirdPick}
                              onChange={(event) =>
                                handleAllianceEntryChange(index, 'thirdPick', event.currentTarget.value)
                              }
                            />
                          </Table.Td>
                        ) : null}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Paper>
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ flex: '5 1 0%', display: 'flex', minWidth: 0 }}
          >
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Pick Lists</Title>
              {isPickListPanelLoading ? (
                <Group justify="center">
                  <Loader aria-label="Loading pick lists" />
                </Group>
              ) : sortedPickLists.length === 0 ? (
                <Text c="dimmed">No pick lists available.</Text>
              ) : (
                <>
                  <Select
                    label="Pick list"
                    placeholder="Select a pick list"
                    data={pickListSelectOptions}
                    value={selectedPickListId}
                    onChange={setSelectedPickListId}
                    withinPortal
                  />
                  <ScrollArea style={{ flex: 1 }}>
                    <PickListPreview
                      ranks={selectedPickListRanks}
                      eventTeamsByNumber={eventTeamsByNumber}
                      selectedTeamNumbers={selectedTeams}
                    />
                  </ScrollArea>
                </>
              )}
            </Stack>
          </Paper>
        </Flex>
      </Flex>
    </Box>
  );
}
