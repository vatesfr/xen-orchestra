import type { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VmDashboardBackupReplication from '@/modules/vm/components/dashboard/VmDashboardBackupReplication.vue'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { useXoSrCollectionMock, useXoSrUtilsMock, getSrById, getVmById } = vi.hoisted(() => ({
  useXoSrCollectionMock: vi.fn(),
  useXoSrUtilsMock: vi.fn(),
  getSrById: vi.fn(),
  getVmById: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: useXoSrCollectionMock as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ getVmById })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/storage-repository/composables/xo-sr-utils.composable.ts'), () => ({
  useXoSrUtils: useXoSrUtilsMock as unknown as typeof useXoSrUtils,
}))

beforeEach(() => {
  useXoSrCollectionMock.mockReset()
  useXoSrUtilsMock.mockReset()
  getSrById.mockReset()
  getVmById.mockReset()

  useXoSrCollectionMock.mockReturnValue({ getSrById, areSrsReady: ref(true), hasSrFetchError: ref(false) })
  useXoSrUtilsMock.mockReturnValue({ srStatusIcon: computed(() => objectIcon('sr', 'connected')) })
  getSrById.mockReturnValue(undefined)
  getVmById.mockReturnValue(undefined)
})

type VmReplication = NonNullable<NonNullable<XoVmDashboard['backupsInfo']>['replication']>

function createReplication(overrides: Partial<VmReplication> = {}): VmReplication {
  return { id: 'vm-1' as VmReplication['id'], timestamp: 1660000000000, ...overrides }
}

function createDashboard(replication: VmReplication | undefined): XoVmDashboard {
  return { backupsInfo: { replication } } as XoVmDashboard
}

function mountReplication(vmDashboard: XoVmDashboard | undefined, hasError = false) {
  return mount(VmDashboardBackupReplication, {
    props: { vmDashboard, hasError },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountReplication(createDashboard(createReplication()))

  expect(wrapper.get('.ui-card-title').text()).toBe('Last replication')
})

it('shows a loader while the dashboard has not reported any replication yet', () => {
  const wrapper = mountReplication(createDashboard(undefined))

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows a loader while the storage repositories are still loading', () => {
  useXoSrCollectionMock.mockReturnValue({ getSrById, areSrsReady: ref(false), hasSrFetchError: ref(false) })

  const wrapper = mountReplication(createDashboard(createReplication()))

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the dashboard failed', () => {
  const wrapper = mountReplication(createDashboard(createReplication()), true)

  expect(wrapper.get('.vts-state-hero').text()).toBe("Error, can't collect data.")
})

it('shows an error message when the storage repositories failed to load', () => {
  useXoSrCollectionMock.mockReturnValue({ getSrById, areSrsReady: ref(true), hasSrFetchError: ref(true) })

  const wrapper = mountReplication(createDashboard(createReplication()))

  expect(wrapper.get('.vts-state-hero').text()).toBe("Error, can't collect data.")
})

it('reports that the VM is not replicated when the replication is empty', () => {
  const wrapper = mountReplication(createDashboard({} as VmReplication))

  expect(wrapper.get('.vts-state-hero').text()).toBe(
    'This VM isn’t being replicated. Configure a replication job to enable it.'
  )
})

it('shows the replicated VM, its date and its storage repository', () => {
  getVmById.mockReturnValue(createVm({ name_label: 'Web server' }))
  getSrById.mockReturnValue(createSr({ name_label: 'Backup SR' }))

  const wrapper = mountReplication(createDashboard(createReplication({ sr: 'sr-1' as VmReplication['sr'] })))

  expect(findLabelledValues(wrapper)).toMatchObject({ VM: 'Web server', 'Storage repository': 'Backup SR' })
  expect(findLabelledValues(wrapper).Date).not.toBe('')
})

it('leaves the VM and storage repository rows empty when neither can be resolved', () => {
  const wrapper = mountReplication(createDashboard(createReplication()))

  expect(findLabelledValues(wrapper)).toMatchObject({ VM: '', 'Storage repository': '' })
})
