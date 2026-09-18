import { useSiteDashboardSection } from '@/modules/site/composables/use-site-dashboard-section.composable.ts'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { mountComposable } from '@/test/mount-composable.ts'

// Read only when the composable runs, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

type Section = { jobs: string[] } | { isEmpty: true } | { error: true }

/** Left out, the section has not arrived yet. */
function mountSection(section?: Section) {
  const { wrapper } = mountComposable(() => useSiteDashboardSection(() => section, 'jobs'))

  return wrapper.vm
}

it('reports a section that has not arrived as loading, and hands out nothing', () => {
  expect(mountSection()).toMatchObject({ data: undefined, isLoading: true, isEmpty: false, hasError: false })
})

it('hands out the section once it arrives', () => {
  expect(mountSection({ jobs: ['nightly'] })).toMatchObject({
    data: { jobs: ['nightly'] },
    isLoading: false,
    isEmpty: false,
    hasError: false,
  })
})

it('reports a section the site has nothing to fill as empty, and hands out nothing', () => {
  expect(mountSection({ isEmpty: true })).toMatchObject({ data: undefined, isLoading: false, isEmpty: true })
})

it('reports a section the site could not compute as in error, and hands out nothing', () => {
  expect(mountSection({ error: true })).toMatchObject({ data: undefined, isLoading: false, hasError: true })
})

it('reports a section as in error when the dashboard itself could not be fetched', () => {
  siteDashboard.hasError.value = true

  expect(mountSection({ jobs: ['nightly'] })).toMatchObject({ hasError: true, data: { jobs: ['nightly'] } })
})

it('hands out nothing while the section is still loading, whatever the dashboard reports', () => {
  siteDashboard.hasError.value = true

  expect(mountSection()).toMatchObject({ data: undefined, isLoading: true, hasError: true })
})
