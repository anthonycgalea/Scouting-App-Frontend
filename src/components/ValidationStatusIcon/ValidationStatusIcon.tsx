import { Box, Loader } from '@mantine/core';
import {
  IconCircle,
  IconCircleCheck,
  IconExclamationCircle,
} from '@tabler/icons-react';

import { type TeamMatchValidationStatus } from '@/api';

interface ValidationStatusIconProps {
  status?: TeamMatchValidationStatus;
  isLoading?: boolean;
  isError?: boolean;
}

const wrapIcon = (icon: JSX.Element, label: string) => (
  <Box component="span" aria-label={label} role="img" title={label}>
    {icon}
  </Box>
);

export function ValidationStatusIcon({
  status,
  isLoading,
  isError,
}: ValidationStatusIconProps) {
  if (isLoading) {
    return wrapIcon(<Loader size="md" color="gray-1" />, 'Loading validation status');
  }

  if (isError) {
    return wrapIcon(
      <IconCircle size={20} color="var(--mantine-color-gray-5)" stroke={1.5} />,
      'Validation status unavailable'
    );
  }

  switch (status) {
    case 'PENDING':
      return wrapIcon(
        <IconCircle
          size={18}
          color="var(--mantine-color-dark-5)"
          stroke={1.5}
          style={{ fill: 'var(--mantine-color-yellow-5)' }}
        />,
        'Validation pending'
      );
    case 'NEEDS REVIEW':
      return wrapIcon(
        <IconExclamationCircle
          size={25}
          color="var(--mantine-color-orange-6)"
          stroke={1.5}
        />,
        'Needs review'
      );
    case 'VALID':
      return wrapIcon(
        <IconCircleCheck size={25} color="var(--mantine-color-green-6)" stroke={1.5} />,
        'Validated'
      );
    default:
      return wrapIcon(
        <IconCircle size={15} color="var(--mantine-color-gray-5)" stroke={1.5} />,
        'Validation status missing'
      );
  }
}

