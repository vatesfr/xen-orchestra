import HostDashboardPatches from '@/modules/host/components/dashboard/HostDashboardPatches.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  MissingPatch,
  useXoHostMissingPatchesCollection,
} from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findTableRows } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoHostMissingPatchesCollectionMock } = vi.hoisted(() => ({
  useXoHostMissingPatchesCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'), () => ({
  useXoHostMissingPatchesCollection:
    useXoHostMissingPatchesCollectionMock as unknown as typeof useXoHostMissingPatchesCollection,
}))

const host = createHost({ id: 'host-1' as FrontXoHost['id'] })

function givenMissingPatches(missingPatches: MissingPatch[], areReady = true) {
  useXoHostMissingPatchesCollectionMock.mockReturnValue({
    hostMissingPatches: ref(missingPatches),
    areHostMissingPatchesReady: ref(areReady),
  })
}

beforeEach(() => {
  useXoHostMissingPatchesCollectionMock.mockReset()
  givenMissingPatches([])
})

function mountPatches() {
  return mount(HostDashboardPatches, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountPatches()

  expect(wrapper.get('.ui-card-title').text()).toContain(t('patches'))
})

it('counts the missing patches next to the title', () => {
  givenMissingPatches([
    { name: 'XSAPATCH-1', version: '1.0' },
    { name: 'XSAPATCH-2', version: '2.0' },
  ])

  const wrapper = mountPatches()

  expect(wrapper.get('.missing-patches-info').text()).toBe(t('n-missing', 2))
})

it('leaves out the count when the host misses no patch', () => {
  const wrapper = mountPatches()

  expect(wrapper.find('.missing-patches-info').exists()).toBe(false)
})

it('lists one row per missing patch', () => {
  givenMissingPatches([
    { name: 'XSAPATCH-1', version: '1.0' },
    { name: 'XSAPATCH-2', version: '2.0' },
  ])

  const wrapper = mountPatches()

  expect(findTableRows(wrapper)).toEqual([
    ['XSAPATCH-1', '1.0'],
    ['XSAPATCH-2', '2.0'],
  ])
})

it('reports the host as up to date when it misses no patch', () => {
  const wrapper = mountPatches()

  expect(wrapper.get('.vts-state-hero').text()).toContain(t('patches-up-to-date'))
  expect(findTableRows(wrapper)).toEqual([])
})

it('reports the host as up to date while its patches are still loading', () => {
  givenMissingPatches([], false)

  const wrapper = mountPatches()

  expect(wrapper.get('.vts-state-hero').text()).toContain(t('patches-up-to-date'))
  expect(wrapper.find('.ui-loader').exists()).toBe(false)
})
