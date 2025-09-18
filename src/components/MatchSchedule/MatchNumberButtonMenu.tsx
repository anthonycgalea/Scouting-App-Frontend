import { IconChevronDown, IconClipboardList, IconPlayerPlay } from '@tabler/icons-react';
import { Button, Menu, useMantineTheme } from '@mantine/core';

interface MatchNumberButtonMenuProps {
  matchNumber: number;
}

export function MatchNumberButtonMenu({ matchNumber }: MatchNumberButtonMenuProps) {
  const theme = useMantineTheme();

  return (
    <Menu
      transitionProps={{ transition: 'pop-top-right' }}
      position="top-end"
      width={220}
      withinPortal
      radius="md"
    >
      <Menu.Target>
        <Button
          aria-label={`Match ${matchNumber} actions`}
          rightSection={<IconChevronDown size={18} stroke={1.5} />}
          pr={12}
          radius="md"
          variant="subtle"
        >
          Match {matchNumber}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Match {matchNumber}</Menu.Label>
        <Menu.Item
          leftSection={<IconClipboardList size={16} color={theme.colors.blue[6]} stroke={1.5} />}
        >
          View match details
        </Menu.Item>
        <Menu.Item
          leftSection={<IconPlayerPlay size={16} color={theme.colors.green[6]} stroke={1.5} />}
        >
          Start scouting
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}