import { useMemo } from 'react';
import {
  IconBulb,
  IconCircleKey,
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
import { isOrganizationRoleAllowed } from '@/hooks/useRequireOrganizationAccess';
import { useAuth } from '../../auth/AuthProvider';
import { Logo } from './Logo';
import classes from './NavbarNested.module.css';

const NAV_LINKS_BEFORE_PICKING = [
  { label: 'Dashboard', icon: IconGauge, to: '/dashboard' },
  { label: 'Matches', icon: IconNotes, to: '/matches' },
  { label: 'Teams', icon: IconUsersGroup, to: '/teams' },
  { label: 'SuperScout', icon: IconBulb, to: '/superScout' },
  { label: 'Analytics', icon: IconPresentationAnalytics,
    links: [
      { label: 'Summary', link: '/analytics'},
      { label: 'Compare', link: '/analytics/compare' }
    ]
  }
];

const PICKING_LINKS_DATA = {
  label: 'Picking',
  icon: IconNumber123,
  links: [
    { label: 'Pick Lists', link: '/picking/pickLists' },
    { label: 'Alliance Selection', link: '/picking/allianceSelection' },
    { label: 'List Generators', link: '/picking/listGenerators' },
  ],
};

const NAV_LINKS_AFTER_PICKING = [
  {
    label: 'Data Manager',
    icon: IconFileAnalytics,
    links: [
      { label: 'Data Validation', link: '/dataValidation' },
      { label: 'Data Import/Export', link: '/dataImport' },
    ],
  },
];

const ORGANIZATION_LINKS_DATA = {
  label: 'Organization',
  icon: IconLock,
  links: [
    { label: 'Team Members', link: '/teamMembers' },
    { label: 'Events', link: '/eventSelect' },
  ],
};

const SITE_ADMIN_LINKS_DATA = {
  label: 'Site Admin',
  icon: IconCircleKey,
  to: '/admin/organizations',
};

export function NavbarNested() {
  const { user, loading, logout } = useAuth();
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const { data: userRole } = useUserRole({ enabled: isUserLoggedIn });
  const canAccessPrivilegedSections = isOrganizationRoleAllowed(userRole?.role ?? null);
  const canManageOrganizations = canAccessPrivilegedSections;
  const isSiteAdmin = Boolean(userRole?.isSiteAdmin);

  const linksData = useMemo(
    () => {
      const links = [...NAV_LINKS_BEFORE_PICKING];

      if (canAccessPrivilegedSections) {
        links.push(PICKING_LINKS_DATA);
      }

      links.push(...NAV_LINKS_AFTER_PICKING);

      if (isUserLoggedIn && canManageOrganizations) {
        links.push(ORGANIZATION_LINKS_DATA);
      }

      if (isSiteAdmin) {
        links.push(SITE_ADMIN_LINKS_DATA);
      }

      return links;
    },
    [canAccessPrivilegedSections, canManageOrganizations, isSiteAdmin, isUserLoggedIn],
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