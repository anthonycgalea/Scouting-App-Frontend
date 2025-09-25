import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { useEffect } from 'react';
import { NavbarNested } from './components/Navbar/NavbarNested';
import { HomePage } from './pages/Home.page';
import { MatchSchedulePage } from './pages/MatchSchedule.page';
import { UserSettingsPage } from './pages/Settings.page';
import { theme } from './theme';
import { TeamMembersPage } from './pages/TeamMembers.page';
import { TeamDirectoryPage } from './pages/TeamDirectory.page';
import { TeamDetailPage } from './pages/TeamDetailPage.page';
import { DataValidationPage } from './pages/DataValidation.page';
import { DataImportPage } from './pages/DataImport.page';
import { SuperScoutPage } from './pages/SuperScout.page';
import { OrganizationEventSelectPage } from './pages/OrganizationEventSelect.page';
import { AddEventPage } from './pages/AddEvent.page';
import { ApplyToOrganizationPage } from './pages/ApplyToOrganization.page';
import { useAuth } from './auth/AuthProvider';

const rootRoute = createRootRoute({
  component: function RootLayout() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useRouterState({ select: (state) => state.location });

    useEffect(() => {
      if (!loading && !user && location.pathname !== '/') {
        navigate({ to: '/', replace: true });
      }
    }, [loading, user, location.pathname, navigate]);

    return (
      <MantineProvider theme={theme}>
        <div style={{ display: 'flex', height: '100vh' }}>
          {!loading && user ? <NavbarNested /> : null}
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

const dataValidationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dataValidation',
  component: DataValidationPage,
});

const dataImportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dataImport',
  component: DataImportPage,
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

const applyToOrganizationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations/apply',
  component: ApplyToOrganizationPage,
});

const organizationEventSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eventSelect',
  component: OrganizationEventSelectPage,
});

const addEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/eventSelect/add',
  component: AddEventPage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([]),
  matchScheduleRoute.addChildren([]),
  teamDirectoryRoute.addChildren([]),
  teamDetailRoute.addChildren([]),
  dataValidationRoute.addChildren([]),
  dataImportRoute.addChildren([]),
  superScoutRoute.addChildren([]),
  settingsRoute.addChildren([]),
  teamMembersRoute.addChildren([]),
  organizationEventSelectRoute.addChildren([]),
  addEventRoute.addChildren([]),
  applyToOrganizationRoute.addChildren([])
]);


export const router = createRouter({ routeTree });
