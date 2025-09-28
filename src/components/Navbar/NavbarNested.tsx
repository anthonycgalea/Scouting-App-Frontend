import { useMemo } from 'react';
import {
  IconSettings,
  IconBulb,
  IconFileAnalytics,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
  IconUsersGroup,
  IconNumber123,
} from '@tabler/icons-react';
import { Button, Code, Group, ScrollArea } from '@mantine/core';
import { LinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup';
import { UserButton } from '../UserButton/UserButton';
import { useUserInfo, useUserRole } from '@/api';
import { useAuth } from '../../auth/AuthProvider';
import { Logo } from './Logo';
import classes from './NavbarNested.module.css';

const BASE_LINKS_DATA = [
  { label: 'Dashboard', icon: IconGauge, to: '/dashboard' },
  { label: 'Matches', icon: IconNotes, to: '/matches' },
  { label: 'Teams', icon: IconUsersGroup, to: '/teams' },
  { label: 'SuperScout', icon: IconBulb, to: '/superScout' },
  { label: 'Analytics', icon: IconPresentationAnalytics, to: '/analytics' },
  {
    label: 'Picking',
    icon: IconNumber123,
    links: [
      { label: 'Pick Lists', link: '/picking/pickLists' },
      { label: 'Alliance Selection', link: '/picking/allianceSelection' },
    ],
  },
  {
    label: 'Data Manager',
    icon: IconFileAnalytics,
    links: [
      { label: 'Data Validation', link: '/dataValidation' },
      { label: 'Data Import', link: '/dataImport' },
    ],
  },
  { label: 'User Settings', icon: IconSettings, to: '/userSettings' },
];

const ORGANIZATION_LINKS_DATA = {
  label: 'Organization',
  icon: IconLock,
  links: [
    { label: 'Team Members', link: '/teamMembers' },
    { label: 'Events', link: '/eventSelect' },
  ],
};

export function NavbarNested() {
  const { user, loading, logout } = useAuth();
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const { data: userRole } = useUserRole({ enabled: isUserLoggedIn });
  const canManageOrganizations = userRole?.role === 'LEAD' || userRole?.role === 'ADMIN';

  const linksData = useMemo(
    () =>
      isUserLoggedIn && canManageOrganizations
        ? [...BASE_LINKS_DATA, ORGANIZATION_LINKS_DATA]
        : BASE_LINKS_DATA,
    [canManageOrganizations, isUserLoggedIn],
  );

  const links = linksData.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group justify="space-between">
          <Logo style={{ width: 120 }} />
          <Code fw={700}>v0.0.1</Code>
        </Group>
      </div>

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>
        {!loading && user ? (
          <>
            <Button fullWidth mb="sm" variant="light" onClick={logout}>
              Log out
            </Button>
            <UserButton />
          </>
        ) : (
          <UserButton />
        )}
      </div>
    </nav>
  );
}