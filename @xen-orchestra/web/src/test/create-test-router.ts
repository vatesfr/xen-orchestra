import { mapValues } from 'lodash-es'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const EmptyPage = { render: () => null }

/**
 * Same route tree, with every lazy page import replaced by an empty component.
 *
 * A test never renders a page, and installing a router runs an initial
 * navigation: keeping the real components would import the whole page module
 * graph on every mount.
 */
function withoutPageComponents(route: RouteRecordRaw): RouteRecordRaw {
  return {
    ...route,
    ...('component' in route && route.component !== undefined && { component: EmptyPage }),
    ...('components' in route &&
      route.components !== undefined && { components: mapValues(route.components, () => EmptyPage) }),
    ...(route.children !== undefined && { children: route.children.map(withoutPageComponents) }),
  } as RouteRecordRaw
}

const testRoutes = routes.map(withoutPageComponents)

/**
 * Builds a router over the real generated routes, on an in-memory history so a
 * test never touches the URL.
 *
 * Paths and names are the real ones, so `href` assertions read as real paths
 * rather than a stub echoing back its own prop.
 */
export function createTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes: testRoutes })
}
