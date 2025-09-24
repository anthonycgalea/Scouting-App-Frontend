import {
  IconAdjustments,
  IconBulb,
  IconFileAnalytics,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Code, Group, ScrollArea } from '@mantine/core';
import { LinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup';
import { UserButton } from '../UserButton/UserButton';
import { Logo } from './Logo';
import classes from './NavbarNested.module.css';

const data = [
  { label: 'Dashboard', icon: IconGauge },
  { label: 'Matches', icon: IconNotes, to: '/matches' },
  { label: 'Teams', icon: IconUsersGroup, to: '/teams' },
  { label: 'SuperScout', icon: IconBulb, to: '/superScout' },
  { label: 'Analytics', icon: IconPresentationAnalytics },
  { label: 'Data Manager', icon: IconFileAnalytics, to: '/dataManager' },
  { label: 'User Settings', icon: IconAdjustments, to: '/userSettings' },
  {
    label: 'Organization',
    icon: IconLock,
    links: [
      { label: 'Team Members', link: '/teamMembers' },
      { label: 'Events', link: '/eventSelect' }
    ],
  },
];

export function NavbarNested() {
  const links = data.map((item) => <LinksGroup {...item} key={item.label} />);

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
        <UserButton />
      </div>
    </nav>
  );
}