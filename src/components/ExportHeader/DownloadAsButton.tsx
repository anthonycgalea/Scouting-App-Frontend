import {
  IconChevronDown,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
} from '@tabler/icons-react';
import { Button, Menu, useMantineTheme } from '@mantine/core';

export function DownloadAsButton() {
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
        <Button rightSection={<IconChevronDown size={18} stroke={1.5} />} pr={12} radius="md">
          Export As
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconFileTypeCsv size={16} color={theme.colors.pink[6]} stroke={1.5} />}
        >
          CSV
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileTypeXls size={16} color={theme.colors.blue[6]} stroke={1.5} />}
        >
          XLS
        </Menu.Item>
        <Menu.Item
          leftSection={<IconJson size={16} color={theme.colors.cyan[6]} stroke={1.5} />}
        >
          JSON
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileTypePdf size={16} color={theme.colors.cyan[6]} stroke={1.5} />}
        >
          PDF
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}