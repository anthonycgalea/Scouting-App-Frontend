import { Alert, Skeleton, Title } from '@mantine/core';
import { useEventInfo } from '@/api';
import classes from './EventHeader.module.css';

interface EventHeaderProps {
  pageInfo?: string;
}

export const EventHeader = ({ pageInfo = 'Match Schedule' }: EventHeaderProps) => {
  const { data: eventInfo, isLoading, isError } = useEventInfo();

  if (isLoading) {
    return <Skeleton height={34} width="50%" radius="sm" />;
  }

  if (isError) {
    return <Alert color="red" title="Unable to load event information" />;
  }

  if (!eventInfo) {
    return (
      <Title className={classes.Title} order={2}>
        {pageInfo}
      </Title>
    );
  }

  const shortName = eventInfo.short_name?.trim();
  const displayName = shortName?.length ? shortName : eventInfo.event_name;

  return (
    <Title className={classes.Title} order={2}>
      {eventInfo.year} {displayName} {pageInfo}
    </Title>
  );
};
