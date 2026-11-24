import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import SrLink from '@/modules/storage-repository/components/SrLink.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'pbd', 'pool', 'sr')

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountLink(sr: FrontXoSr = createSr({ id: 'sr-42' as FrontXoSr['id'], name_label: 'Local storage' })) {
  return mount(SrLink, {
    props: { sr },
    global: createGlobalTestConfig(),
  })
}

// An SR whose PBDs are attached or not, in that order
function createSrWithPbds(...attached: boolean[]) {
  const sr = createSr({ id: 'sr-42' as FrontXoSr['id'] })

  xoCollectionsMock.pbds.value = attached.map((isAttached, index) =>
    createPbd({ id: `pbd-${index}` as FrontXoPbd['id'], SR: sr.id, attached: isAttached })
  )

  return { ...sr, $PBDs: xoCollectionsMock.pbds.value.map(pbd => pbd.id) }
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
  const sr = createSrWithPbds(...attached)

  expect(mountLink(sr).getComponent(UiLink).props('icon')).toBe(objectIcon('sr', status))
})

it('flags the default SR of the pool as primary', () => {
  const sr = createSr({ id: 'sr-42' as FrontXoSr['id'] })
  xoCollectionsMock.pools.value = [createPool({ id: sr.$pool, default_SR: sr.id })]

  const link = mountLink(sr).getComponent(UiLink)

  expect(link.props('isPrimary')).toBe(true)
  expect(link.props('primaryTooltip')).toBe(t('default-storage-repository'))
})

it('does not flag any other SR as primary', () => {
  const sr = createSr({ id: 'sr-42' as FrontXoSr['id'] })
  xoCollectionsMock.pools.value = [createPool({ id: sr.$pool, default_SR: 'sr-other' as FrontXoSr['id'] })]

  expect(mountLink(sr).getComponent(UiLink).props('isPrimary')).toBe(false)
})
