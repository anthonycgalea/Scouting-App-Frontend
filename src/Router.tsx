import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { HomePage } from './pages/Home.page'
import { MatchSchedulePage } from './pages/MatchSchedule.page'

const rootRoute = createRootRoute()

// Define your app routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const matchScheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matchSchedule',
  component: MatchSchedulePage,
})

// Build the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([]),
  matchScheduleRoute.addChildren([])
])


// Create the router
const router = createRouter({ routeTree })


export function Router() {
  return <RouterProvider router={router} />
}
