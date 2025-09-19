import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { NavbarNested } from './components/Navbar/NavbarNested';
import { HomePage } from './pages/Home.page';
import { MatchSchedulePage } from './pages/MatchSchedule.page';
import { UserSettingsPage } from './pages/Settings.page';
import { theme } from './theme';
import { TeamMembersPage } from './pages/TeamMembers.page';
import { TeamDirectoryPage } from './pages/TeamDirectory.page';
import { TeamDetailPage } from './pages/TeamDetailPage.page';
import { DataManagerPage } from './pages/DataManager.page';
import { SuperScoutPage } from './pages/SuperScout.page';

const rootRoute = createRootRoute({
  component: function RootLayout() {
    return (
      <MantineProvider theme={theme}>
        <div style={{ display: 'flex', height: '100vh' }}>
          <NavbarNested />
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Outlet />
          </div>
        </div>
      </MantineProvider>
    );
  },
});

// Define your app routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const matchScheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matches',
  component: MatchSchedulePage,
});

const teamDirectoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teams',
  component: TeamDirectoryPage,
});

const teamDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teams/$teamId',
  component: TeamDetailPage,
});

const dataManagerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dataManager',
  component: DataManagerPage,
});

const superScoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/superScout',
  component: SuperScoutPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/userSettings',
  component: UserSettingsPage,
});

const teamMembersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teamMembers',
  component: TeamMembersPage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([]),
  matchScheduleRoute.addChildren([]),
  teamDirectoryRoute.addChildren([]),
  teamDetailRoute.addChildren([]),
  dataManagerRoute.addChildren([]),
  superScoutRoute.addChildren([]),
  settingsRoute.addChildren([]),
  teamMembersRoute.addChildren([])
]);


export const router = createRouter({ routeTree });
