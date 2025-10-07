import { useMemo } from 'react';

import {
  ActionIcon,
  Badge,
  Group,
  Loader,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';

import { useSuperScoutFields, useSuperScoutMatchData } from '@/api';

export interface TeamCommonComment {
  key: string;
  label: string;
  count: number;
}

export interface TeamCommonCommentsResult {
  comments: TeamCommonComment[];
  isLoading: boolean;
  isError: boolean;
}

interface UseTeamCommonCommentsOptions {
  minimumOccurrences?: number;
  limit?: number;
}

const DEFAULT_MINIMUM_OCCURRENCES = 3;
const DEFAULT_LIMIT = 5;

const isCommentSelected = (value: unknown) =>
  value === true ||
  value === 1 ||
  value === 'true' ||
  value === '1' ||
  value === 'True';

export const useTeamCommonComments = (
  teamNumber: number,
  { minimumOccurrences = DEFAULT_MINIMUM_OCCURRENCES, limit = DEFAULT_LIMIT }: UseTeamCommonCommentsOptions = {},
): TeamCommonCommentsResult => {
  const {
    data: superScoutFields = [],
    isLoading: isLoadingFields,
    isError: isFieldsError,
  } = useSuperScoutFields();
  const {
    data: matchEntries = [],
    isLoading: isLoadingMatches,
    isError: isMatchesError,
  } = useSuperScoutMatchData(teamNumber);

  const comments = useMemo(() => {
    if (!teamNumber || superScoutFields.length === 0 || matchEntries.length === 0) {
      return [] as TeamCommonComment[];
    }

    const labelByKey = new Map(superScoutFields.map((field) => [field.key, field.label]));
    const counts = new Map<string, number>();

    matchEntries.forEach((entry) => {
      superScoutFields.forEach(({ key }) => {
        if (isCommentSelected(entry[key])) {
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      });
    });

    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        label: labelByKey.get(key) ?? key,
      }))
      .filter((comment) => comment.count >= minimumOccurrences)
      .sort((first, second) => {
        if (first.count !== second.count) {
          return second.count - first.count;
        }

        return first.label.localeCompare(second.label);
      })
      .slice(0, limit);
  }, [teamNumber, superScoutFields, matchEntries, minimumOccurrences, limit]);

  return {
    comments,
    isLoading: isLoadingFields || isLoadingMatches,
    isError: isFieldsError || isMatchesError,
  };
};

interface TeamCommonCommentsBadgeListProps {
  result: TeamCommonCommentsResult;
  badgeSize?: 'xs' | 'sm' | 'md';
  emptyLabel?: string;
  loaderSize?: 'xs' | 'sm' | 'md';
}

export function TeamCommonCommentsBadgeList({
  result,
  badgeSize = 'xs',
  emptyLabel = 'No common comments yet.',
  loaderSize = 'xs',
}: TeamCommonCommentsBadgeListProps) {
  const { comments, isLoading, isError } = result;

  if (isLoading) {
    return (
      <Group gap="xs" wrap="nowrap" align="center" justify="flex-start">
        <Loader size={loaderSize} />
        <Text size="xs" c="dimmed">
          Loading common comments…
        </Text>
      </Group>
    );
  }

  if (isError) {
    return (
      <Text size="xs" c="red.6">
        Unable to load common comments.
      </Text>
    );
  }

  if (comments.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Group gap="xs" wrap="wrap" align="center" justify="flex-start">
      {comments.map((comment) => (
        <Badge key={comment.key} size={badgeSize} variant="light" color="grape">
          {comment.label} (x{comment.count})
        </Badge>
      ))}
    </Group>
  );
}

interface TeamCommonCommentsTooltipProps {
  teamNumber: number;
  iconSize?: number;
  ariaLabel?: string;
}

export function TeamCommonCommentsTooltip({
  teamNumber,
  iconSize = 18,
  ariaLabel,
}: TeamCommonCommentsTooltipProps) {
  const result = useTeamCommonComments(teamNumber);
  const hasComments = result.comments.length > 0;

  return (
    <Tooltip
      label={
        <Stack gap="xs">
          <Text fw={600} size="xs">
            Common comments
          </Text>
          <TeamCommonCommentsBadgeList result={result} />
        </Stack>
      }
      withArrow
      withinPortal
      maw={320}
      position="top"
    >
      <ActionIcon
        variant="subtle"
        color={hasComments ? 'blue' : 'gray'}
        aria-label={
          ariaLabel ?? `View common super scout comments for team ${teamNumber}`
        }
      >
        <IconMessage size={iconSize} />
      </ActionIcon>
    </Tooltip>
  );
}
