import {
  IconAdjustments,
  IconBulb,
  IconFileAnalytics,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
} from '@tabler/icons-react';
import { Code, Group, ScrollArea } from '@mantine/core';
import { LinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup';
import { UserButton } from '../UserButton/UserButton';
import { Logo } from './Logo';
import classes from './NavbarNested.module.css';

const data = [
  { label: 'Dashboard', icon: IconGauge },
  { label: 'Match Schedule', icon: IconNotes, to: '/matchSchedule' },
  { label: 'SuperScout', icon: IconBulb },
  { label: 'Analytics', icon: IconPresentationAnalytics },
  { label: 'Data Manager', icon: IconFileAnalytics },
  { label: 'User Settings', icon: IconAdjustments },
  {
    label: 'Organization',
    icon: IconLock,
    links: [
      { label: 'Team Members', link: '/' },
      { label: 'Events', link: '/' },
      { label: 'Organization Settings', link: '/' },
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