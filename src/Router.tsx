import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { NavbarNested } from './components/Navbar/NavbarNested';
import { HomePage } from './pages/Home.page';
import { DashboardPage } from './pages/Dashboard.page';
import { MatchSchedulePage } from './pages/MatchSchedule.page';
import { UserSettingsPage } from './pages/Settings.page';
import { theme } from './theme';
import { TeamMembersPage } from './pages/TeamMembers.page';
import { TeamDirectoryPage } from './pages/TeamDirectory.page';
import { TeamDetailPage } from './pages/TeamDetailPage.page';
import { DataValidationPage } from './pages/DataValidation.page';
import { MatchValidationPage } from './pages/MatchValidation.page';
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
    const [hasRedirectedToHome, setHasRedirectedToHome] = useState(true);

    useEffect(() => {
      if (loading) {
        return;
      }

      if (user) {
        if (hasRedirectedToHome) {
          setHasRedirectedToHome(false);
        }

        if (location.pathname === '/') {
          navigate({ to: '/dashboard', replace: true });
        }

        return;
      }

      if (!hasRedirectedToHome) {
        setHasRedirectedToHome(true);
      }

      if (location.pathname !== '/') {
        navigate({ to: '/', replace: true });
      }

    }, [
      loading,
      user,
      location.pathname,
      navigate,
      hasRedirectedToHome,
    ]);

    const shouldShowNavbar =
      !loading && !( !user && location.pathname === '/' && hasRedirectedToHome );

    return (
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <div style={{ display: 'flex', height: '100vh' }}>
          {shouldShowNavbar ? <NavbarNested /> : null}
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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
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

const matchValidationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance',
  component: MatchValidationPage,
  validateSearch: (search: Record<string, unknown>) => {
    const rawTeams = search.teams;

    let teams: number[] | undefined;
    if (Array.isArray(rawTeams)) {
      const parsed = rawTeams
        .map((team) => Number.parseInt(String(team), 10))
        .filter((value) => Number.isFinite(value));
      teams = parsed.length > 0 ? parsed : undefined;
    } else if (typeof rawTeams === 'string') {
      const parsed = rawTeams
        .split(',')
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value));
      teams = parsed.length > 0 ? parsed : undefined;
    }

    return { teams };
  },
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
  dashboardRoute.addChildren([]),
  matchScheduleRoute.addChildren([]),
  teamDirectoryRoute.addChildren([]),
  teamDetailRoute.addChildren([]),
  dataValidationRoute.addChildren([matchValidationRoute]),
  dataImportRoute.addChildren([]),
  superScoutRoute.addChildren([]),
  settingsRoute.addChildren([]),
  teamMembersRoute.addChildren([]),
  organizationEventSelectRoute.addChildren([]),
  addEventRoute.addChildren([]),
  applyToOrganizationRoute.addChildren([])
]);


export const router = createRouter({ routeTree });
