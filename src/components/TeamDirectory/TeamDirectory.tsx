import { Anchor, Button, Group, Progress, Table, Text } from '@mantine/core';
import classes from './TeamDirectory.module.css';

const data = [
  {
    teamNumber: 1,
    teamName: 'The Juggernauts',
    year: 1951,
    reviews: { positive: 2223, negative: 259 },
  },
  {
    teamNumber: 33,
    teamName: 'Killer Bees',
    year: 1818,
    reviews: { positive: 5677, negative: 1265 },
  },
  {
    teamNumber: 51,
    teamName: 'Wings of Fire',
    year: 1961,
    reviews: { positive: 3487, negative: 1845 },
  },
  {
    teamNumber: 67,
    teamName: 'HOT',
    year: 1965,
    reviews: { positive: 8576, negative: 663 },
  },
  {
    teamNumber: 68,
    teamName: 'Truck Town Thunder',
    year: 1969,
    reviews: { positive: 6631, negative: 993 },
  },
  {
    teamNumber: 494,
    teamName: 'Martians',
    year: 1977,
    reviews: { positive: 8124, negative: 1847 },
  },
];

export function TeamDirectory() {
  const rows = data.map((row) => {
    const totalReviews = row.reviews.negative + row.reviews.positive;
    const positiveReviews = (row.reviews.positive / totalReviews) * 100;
    const negativeReviews = (row.reviews.negative / totalReviews) * 100;

    return (
      <Table.Tr key={row.teamNumber}>
        <Table.Td>
          <Anchor component="button" fz="sm">
            <Button
              aria-label={`${row.teamNumber}`}
              radius="md"
              variant="subtle"
            >
              {row.teamNumber}
            </Button>             
          </Anchor>
        </Table.Td>
        <Table.Td>{row.teamName}</Table.Td>
        <Table.Td>{Intl.NumberFormat().format(totalReviews)}</Table.Td>
        <Table.Td>
          <Group justify="space-between">
            <Text fz="xs" c="teal" fw={700}>
              {positiveReviews.toFixed(0)}%
            </Text>
            <Text fz="xs" c="red" fw={700}>
              {negativeReviews.toFixed(0)}%
            </Text>
          </Group>
          <Progress.Root>
            <Progress.Section
              className={classes.progressSection}
              value={positiveReviews}
              color="teal"
            />

            <Progress.Section
              className={classes.progressSection}
              value={negativeReviews}
              color="red"
            />
          </Progress.Root>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team #</Table.Th>
            <Table.Th>Team Name</Table.Th>
            <Table.Th>Pit Scouted?</Table.Th>
            <Table.Th>Matches Scouted</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}