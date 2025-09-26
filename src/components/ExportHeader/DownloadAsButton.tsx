import { useState } from 'react';
import {
  IconChevronDown,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFileTypeXls,
  IconJson,
} from '@tabler/icons-react';
import { Button, Menu, useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { exportMatches, type MatchExportType } from '@/api';

const getFileNameFromHeader = (headerValue: string | null, fallback: string) => {
  if (!headerValue) {
    return fallback;
  }

  const utfMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return fallback;
    }
  }

  const asciiMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function DownloadAsButton() {
  const theme = useMantineTheme();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (fileType: MatchExportType) => {
    setIsExporting(true);

    try {
      const response = await exportMatches(fileType);
      const blob = await response.blob();
      const fallbackFileName = `matches.${fileType}`;
      const fileName = getFileNameFromHeader(
        response.headers.get('content-disposition'),
        fallbackFileName,
      );

      downloadBlob(blob, fileName);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Export failed',
        message: 'Failed to export matches. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

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
          rightSection={<IconChevronDown size={18} stroke={1.5} />}
          pr={12}
          radius="md"
          loading={isExporting}
        >
          Export As
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconFileTypeCsv size={16} color={theme.colors.pink[6]} stroke={1.5} />}
          disabled={isExporting}
          onClick={() => {
            void handleExport('csv');
          }}
        >
          CSV
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileTypeXls size={16} color={theme.colors.blue[6]} stroke={1.5} />}
          disabled={isExporting}
          onClick={() => {
            void handleExport('xls');
          }}
        >
          XLS
        </Menu.Item>
        <Menu.Item
          leftSection={<IconJson size={16} color={theme.colors.cyan[6]} stroke={1.5} />}
          disabled={isExporting}
          onClick={() => {
            void handleExport('json');
          }}
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
