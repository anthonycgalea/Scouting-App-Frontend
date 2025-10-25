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
import { MatchPreviewPage } from './pages/MatchPreview.page';
import { UserSettingsPage } from './pages/Settings.page';
import { theme } from './theme';
import { TeamMembersPage } from './pages/TeamMembers.page';
import { TeamDirectoryPage } from './pages/TeamDirectory.page';
import { TeamDetailPage } from './pages/TeamDetailPage.page';
import { DataValidationPage } from './pages/DataValidation.page';
import { MatchValidation } from './components/MatchValidation/MatchValidation';
import { DataImportPage } from './pages/DataImport.page';
import { SuperScoutPage } from './pages/SuperScout.page';
import { OrganizationEventSelectPage } from './pages/OrganizationEventSelect.page';
import { AddEventPage } from './pages/AddEvent.page';
import { ApplyToOrganizationPage } from './pages/ApplyToOrganization.page';
import { useAuth } from './auth/AuthProvider';
import { AnalyticsPage } from './pages/Analytics.page';
import { CompareTeamsPage } from './pages/CompareTeams.page';
import { PickListsPage } from './pages/PickLists.page';
import { AllianceSelectionPage } from './pages/AllianceSelection.page';
import { ListGeneratorPage } from './pages/ListGenerator.page';
import { SuperScoutMatchPage } from './pages/SuperScoutMatch.page';
import { SiteAdminOrganizationsPage } from './pages/SiteAdminOrganizations.page';
import { useUserOrganization, type UserOrganizationResponse } from './api';

const ORGANIZATION_SELECTION_ROUTES = ['/userSettings', '/organizations/apply'];

const getOrganizationId = (
  organization: UserOrganizationResponse | null | undefined,
) => {
  if (!organization) {
    return null;
  }

  if (typeof organization.organization_id === 'number') {
    return organization.organization_id;
  }

  const { organizationId } = organization as { organizationId?: number | null };

  return typeof organizationId === 'number' ? organizationId : null;
};

const rootRoute = createRootRoute({
  component: function RootLayout() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useRouterState({ select: (state) => state.location });
    const {
      data: userOrganization,
      isLoading: isUserOrganizationLoading,
      isError: isUserOrganizationError,
    } = useUserOrganization({ enabled: !!user });
    const [hasRedirectedToHome, setHasRedirectedToHome] = useState(true);

    useEffect(() => {
      if (loading) {
        return;
      }

      if (user) {
        if (hasRedirectedToHome) {
          setHasRedirectedToHome(false);
        }

        if (!isUserOrganizationLoading && !isUserOrganizationError) {
          const organizationId = getOrganizationId(userOrganization);
          const isOrganizationMissing = organizationId === null;
          const isOnOrganizationSelectionRoute = ORGANIZATION_SELECTION_ROUTES.some((path) =>
            location.pathname.startsWith(path)
          );

          if (isOrganizationMissing && !isOnOrganizationSelectionRoute) {
            navigate({ to: '/userSettings', replace: true });
            return;
          }
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
      isUserOrganizationLoading,
      isUserOrganizationError,
      userOrganization,
    ]);

    return (
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
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

const matchPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matches/preview/$matchLevel/$matchNumber',
  component: MatchPreviewPage,
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
  component: MatchValidation,
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

const superScoutMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/superScout/match/$matchLevel/$matchNumber/$alliance',
  component: SuperScoutMatchPage,
});

const summaryAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const compareTeamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics/compare',
  component: CompareTeamsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/userSettings',
  component: UserSettingsPage,
});

const pickListsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/picking/pickLists',
  component: PickListsPage,
});

const allianceSelectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/picking/allianceSelection',
  component: AllianceSelectionPage,
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

const listGeneratorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/picking/listGenerators',
  component: ListGeneratorPage,
});

const siteAdminOrganizationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/organizations',
  component: SiteAdminOrganizationsPage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([]),
  dashboardRoute.addChildren([]),
  matchScheduleRoute.addChildren([]),
  matchPreviewRoute.addChildren([]),
  teamDirectoryRoute.addChildren([]),
  teamDetailRoute.addChildren([]),
  dataValidationRoute.addChildren([matchValidationRoute]),
  dataImportRoute.addChildren([]),
  superScoutRoute.addChildren([]),
  superScoutMatchRoute.addChildren([]),
  summaryAnalyticsRoute.addChildren([]),
  compareTeamsRoute.addChildren([]),
  settingsRoute.addChildren([]),
  pickListsRoute.addChildren([]),
  listGeneratorRoute.addChildren([]),
  allianceSelectionRoute.addChildren([]),
  teamMembersRoute.addChildren([]),
  organizationEventSelectRoute.addChildren([]),
  addEventRoute.addChildren([]),
  applyToOrganizationRoute.addChildren([]),
  siteAdminOrganizationsRoute.addChildren([]),
]);


export const router = createRouter({ routeTree });
