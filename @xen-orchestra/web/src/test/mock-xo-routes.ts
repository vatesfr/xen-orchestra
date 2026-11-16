import type { useXoRoutes as realUseXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'

// Use as `vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))`:
// the XO 5 routes are fetched, an XO 5 link reads `https://xo5.example.com/#<path>`
export const useXoRoutes = (() => ({
  buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
})) as unknown as typeof realUseXoRoutes
