import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import SrHeader from '@/modules/storage-repository/components/header/SrHeader.vue'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { findHeadBarIconPaths, findHeadBarLabel, hasHeadBarStatus } from '@/test/find-head-bar.ts'
import { findObjectIconPaths } from '@/test/find-icon-paths.ts'
import { findActiveTabLabels, findInAppTabHrefs, findTabLabels } from '@/test/find-tabs.ts'
import { createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Read only when the component mounts, so the module-scope refs are already initialized
const pbdsInSr = ref<FrontXoPbd[]>([])
const arePbdsReady = ref(true)
const isDefaultSr = ref(false)

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => pbdsInSr.value,
    pbdsBySr: ref(new Map()),
    arePbdsReady,
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ isDefaultSr: () => isDefaultSr.value })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    useGetHostById: () => computed(() => createHost({ id: 'host-42' as FrontXoHost['id'] })),
    getHostById: () => undefined,
  })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    useGetPoolById: () => computed(() => createPool({ id: 'pool-7' as FrontXoPool['id'] })),
  })) as unknown as typeof useXoPoolCollection,
}))

const HOST_SCOPE: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: 'host-42' }
const POOL_SCOPE: SrScope = { type: SR_SCOPE_TYPE.POOL }

const sr = createSr({ id: 'sr-42' as FrontXoSr['id'], name_label: 'Local storage' })

beforeEach(() => {
  pbdsInSr.value = []
  arePbdsReady.value = true
  isDefaultSr.value = false
})

async function mountHeader(scope: SrScope = POOL_SCOPE, initialPath?: string) {
  return mount(SrHeader, { props: { sr, scope }, global: await createGlobalTestConfigAt(initialPath) })
}

it('shows the name of the SR', async () => {
  const wrapper = await mountHeader()

  expect(findHeadBarLabel(wrapper)).toBe('Local storage')
})

it('lists every tab of the SR, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabLabels(wrapper)).toEqual([t('general'), t('hosts')])
})

it('points every tab at the page of that SR, opened from its pool', async () => {
  const wrapper = await mountHeader()

  expect(findInAppTabHrefs(wrapper)).toEqual(['/sr/sr-42/general?from=pool', '/sr/sr-42/hosts?from=pool'])
})

it('keeps the host the SR was opened from in every tab', async () => {
  const wrapper = await mountHeader(HOST_SCOPE)

  expect(findInAppTabHrefs(wrapper)).toEqual([
    '/sr/sr-42/general?from=host&host=host-42',
    '/sr/sr-42/hosts?from=host&host=host-42',
  ])
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(POOL_SCOPE, '/sr/sr-42/hosts')

  expect(findActiveTabLabels(wrapper)).toEqual([t('hosts')])
})

it('marks no tab as active while no SR page is open', async () => {
  const wrapper = await mountHeader()

  expect(findActiveTabLabels(wrapper)).toEqual([])
})

it('flags the SR as the default one of its pool', async () => {
  isDefaultSr.value = true

  const wrapper = await mountHeader()

  expect(hasHeadBarStatus(wrapper)).toBe(true)
})

it('does not flag an SR that is not the default one of its pool', async () => {
  const wrapper = await mountHeader()

  expect(hasHeadBarStatus(wrapper)).toBe(false)
})

it('shows the SR as connected while its PBDs are plugged in', async () => {
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = await mountHeader()

  expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('sr', 'connected'))
  expect(findHeadBarIconPaths(wrapper)).not.toEqual(findObjectIconPaths('sr', 'disconnected'))
})

it('shows the SR as partially connected while only some of its PBDs are plugged in', async () => {
  pbdsInSr.value = [
    createPbd({ id: 'pbd-1' as FrontXoPbd['id'], attached: true }),
    createPbd({ id: 'pbd-2' as FrontXoPbd['id'], attached: false }),
  ]

  const wrapper = await mountHeader()

  expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('sr', 'partially-connected'))
})

it('leaves the SR stateless while the PBDs are still loading', async () => {
  arePbdsReady.value = false
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = await mountHeader()

  expect(findHeadBarIconPaths(wrapper)).not.toEqual(findObjectIconPaths('sr', 'connected'))
  expect(findHeadBarIconPaths(wrapper)).not.toEqual([])
})

it('walks back to where the SR was opened from', async () => {
  const wrapper = await mountHeader()

  expect(wrapper.find('.sr-header-breadcrumb').exists()).toBe(true)
})
