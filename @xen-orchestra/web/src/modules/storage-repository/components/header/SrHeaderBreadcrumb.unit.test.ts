import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import SrHeaderBreadcrumb from '@/modules/storage-repository/components/header/SrHeaderBreadcrumb.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { findBreadcrumbLinks } from '@/test/find-breadcrumb.ts'
import { findIconPaths, findNamedIconPaths, findObjectIconPaths } from '@/test/find-icon-paths.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Read only when the component mounts, so the module-scope refs are already initialized
const host = ref<FrontXoHost | undefined>()
const pool = ref<FrontXoPool | undefined>()
const pbdsInSr = ref<FrontXoPbd[]>([])
const arePbdsReady = ref(true)

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    useGetHostById: () => computed(() => host.value),
    getHostById: () => host.value,
  })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    useGetPoolById: () => computed(() => pool.value),
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => pbdsInSr.value,
    pbdsBySr: ref(new Map()),
    arePbdsReady,
  })) as unknown as typeof useXoPbdCollection,
}))

const HOST_SCOPE: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: 'host-42' }
const POOL_SCOPE: SrScope = { type: SR_SCOPE_TYPE.POOL }

const sr = createSr({ name_label: 'Local storage', $pool: 'pool-7' as FrontXoSr['$pool'] })

beforeEach(() => {
  host.value = undefined
  pool.value = undefined
  pbdsInSr.value = []
  arePbdsReady.value = true
})

function givenPool() {
  pool.value = createPool({ id: 'pool-7' as FrontXoPool['id'], name_label: 'Production Pool' })
}

function givenHost(overrides: Partial<FrontXoHost> = {}) {
  host.value = createHost({ id: 'host-42' as FrontXoHost['id'], name_label: 'Primary Host', ...overrides })
}

function mountBreadcrumb(scope: SrScope = POOL_SCOPE) {
  return mount(SrHeaderBreadcrumb, { props: { sr, scope }, global: createGlobalTestConfig() })
}

type BreadcrumbWrapper = ReturnType<typeof mountBreadcrumb>

function findSrIconPaths(wrapper: BreadcrumbWrapper) {
  return findIconPaths(wrapper.get('.sr-name'))
}

it('walks back to the pool of the SR and to its storage', () => {
  givenPool()

  const wrapper = mountBreadcrumb()

  expect(findBreadcrumbLinks(wrapper)).toEqual([
    ['Production Pool', '/pool/pool-7/dashboard'],
    [t('storage'), '/pool/pool-7/storage'],
  ])
})

it('marks the pool it walks back to as a pool', () => {
  givenPool()

  const wrapper = mountBreadcrumb()

  expect(findIconPaths(wrapper.get('.ui-breadcrumb a'))).toEqual(findNamedIconPaths('object:pool'))
})

it('walks back to the host the SR was opened from, and to its storage', () => {
  givenHost()

  const wrapper = mountBreadcrumb(HOST_SCOPE)

  expect(findBreadcrumbLinks(wrapper)).toEqual([
    ['Primary Host', '/host/host-42/dashboard'],
    [t('storage'), '/host/host-42/storage'],
  ])
})

it('shows the state of the host it walks back to', () => {
  givenHost({ power_state: HOST_POWER_STATE.HALTED })

  const wrapper = mountBreadcrumb(HOST_SCOPE)

  expect(findIconPaths(wrapper.get('.ui-breadcrumb a'))).toEqual(findObjectIconPaths('host', 'halted'))
  expect(findIconPaths(wrapper.get('.ui-breadcrumb a'))).not.toEqual(findObjectIconPaths('host', 'running'))
})

it('names the SR at the end of the trail', () => {
  givenPool()

  const wrapper = mountBreadcrumb()

  expect(wrapper.get('.sr-name').text()).toBe('Local storage')
})

it('shows nothing while the pool of the SR is unknown', () => {
  const wrapper = mountBreadcrumb()

  expect(wrapper.find('.sr-header-breadcrumb').exists()).toBe(false)
})

it('shows nothing while the host the SR was opened from is unknown', () => {
  givenPool()

  const wrapper = mountBreadcrumb(HOST_SCOPE)

  expect(wrapper.find('.sr-header-breadcrumb').exists()).toBe(false)
})

it('shows the SR as connected while its PBDs are plugged in', () => {
  givenPool()
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = mountBreadcrumb()

  expect(findSrIconPaths(wrapper)).toEqual(findObjectIconPaths('sr', 'connected'))
  expect(findSrIconPaths(wrapper)).not.toEqual(findObjectIconPaths('sr', 'disconnected'))
})

it('shows the SR as disconnected while its PBDs are unplugged', () => {
  givenPool()
  pbdsInSr.value = [createPbd({ attached: false })]

  const wrapper = mountBreadcrumb()

  expect(findSrIconPaths(wrapper)).toEqual(findObjectIconPaths('sr', 'disconnected'))
})

it('leaves the SR stateless while the PBDs are still loading', () => {
  givenPool()
  arePbdsReady.value = false
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = mountBreadcrumb()

  expect(findSrIconPaths(wrapper)).not.toEqual(findObjectIconPaths('sr', 'connected'))
  expect(findSrIconPaths(wrapper)).not.toEqual([])
})
