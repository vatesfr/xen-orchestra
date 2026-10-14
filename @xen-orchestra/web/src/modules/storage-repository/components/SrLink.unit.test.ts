import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import SrLink from '@/modules/storage-repository/components/SrLink.vue'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSr } from '@/test/create-sr.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'

const { isDefaultSr, getPbdsByIds } = vi.hoisted(() => ({
  isDefaultSr: vi.fn(),
  getPbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ isDefaultSr })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({ getPbdsByIds })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({})) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  isDefaultSr.mockReset()
  getPbdsByIds.mockReset()
  isDefaultSr.mockReturnValue(false)
  getPbdsByIds.mockReturnValue([])
})

function mountLink(sr: FrontXoSr = createSr({ id: 'sr-42' as FrontXoSr['id'], name_label: 'Local storage' })) {
  return mount(SrLink, {
    props: { sr },
    global: createGlobalTestConfig(),
  })
}

function attachPbds(...attached: boolean[]) {
  getPbdsByIds.mockReturnValue(
    attached.map((isAttached, index) => createPbd({ id: `pbd-${index}` as FrontXoPbd['id'], attached: isAttached }))
  )
}

it('shows the name of the SR', () => {
  expect(mountLink().text()).toBe('Local storage')
})

it('links to the general page of the SR', () => {
  expect(mountLink().get('a.ui-link').attributes('href')).toBe('/sr/sr-42/general')
})

it.each([
  { attached: [true, true], status: 'connected' },
  { attached: [true, false], status: 'partially-connected' },
  { attached: [false, false], status: 'disconnected' },
] as const)('shows the $status SR icon when its PBDs are $attached', ({ attached, status }) => {
  attachPbds(...attached)

  expect(mountLink().getComponent(UiLink).props('icon')).toBe(objectIcon('sr', status))
})

it('flags the default SR of the pool as primary', () => {
  isDefaultSr.mockReturnValue(true)

  const link = mountLink().getComponent(UiLink)

  expect(link.props('isPrimary')).toBe(true)
  expect(link.props('primaryTooltip')).toBe(t('default-storage-repository'))
})

it('does not flag any other SR as primary', () => {
  expect(mountLink().getComponent(UiLink).props('isPrimary')).toBe(false)
})
