import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
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

function mountSrLink(sr: FrontXoSr = createSr()) {
  return mount(SrLink, {
    props: { sr },
    global: createGlobalTestConfig(),
  })
}

it('shows the SR name label and links to its general page', () => {
  const wrapper = mountSrLink(createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Fast SR' }))

  expect(wrapper.text()).toBe('Fast SR')
  expect(wrapper.get('.ui-link').attributes('href')).toBe('/sr/sr-1/general')
})

it('picks the connected icon when every PBD of the SR is attached', () => {
  getPbdsByIds.mockReturnValue([createPbd({ attached: true }), createPbd({ attached: true })])

  expect(mountSrLink().getComponent(UiLink).props('icon')).toBe(objectIcon('sr', 'connected'))
})

it('picks the partially connected icon when only some PBDs of the SR are attached', () => {
  getPbdsByIds.mockReturnValue([createPbd({ attached: true }), createPbd({ attached: false })])

  expect(mountSrLink().getComponent(UiLink).props('icon')).toBe(objectIcon('sr', 'partially-connected'))
})

it('picks the disconnected icon when no PBD of the SR is attached', () => {
  getPbdsByIds.mockReturnValue([createPbd({ attached: false })])

  expect(mountSrLink().getComponent(UiLink).props('icon')).toBe(objectIcon('sr', 'disconnected'))
})

it('flags the SR as primary when it is the default SR of its pool', () => {
  isDefaultSr.mockReturnValue(true)

  const link = mountSrLink().getComponent(UiLink)

  expect(link.props('isPrimary')).toBe(true)
  expect(link.props('primaryTooltip')).toBe(t('default-storage-repository'))
})

it('does not flag the SR as primary when it is not the default SR of its pool', () => {
  expect(mountSrLink().getComponent(UiLink).props('isPrimary')).toBe(false)
})
