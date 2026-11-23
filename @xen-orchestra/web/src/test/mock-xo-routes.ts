import type { useXoRoutes as realUseXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { mockModule } from '@/test/spy-on-module.ts'

// Mocked with `mockXoRoutes()`: the XO 5 routes are fetched, an XO 5 link reads `https://xo5.example.com/#<path>`
export const useXoRoutes = (() => ({
  buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
})) as unknown as typeof realUseXoRoutes

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoRoutes() {
  mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))
}
