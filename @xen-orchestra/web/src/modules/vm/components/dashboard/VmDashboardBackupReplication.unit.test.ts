import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VmDashboardBackupReplication from '@/modules/vm/components/dashboard/VmDashboardBackupReplication.vue'
import type { XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { type DashboardCardProps, itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findLabelledValues, findRowLabels } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { HOLD_LOADING } from '@/test/host-dashboard-card.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { formatDateTime } from '@core/utils/time.util.ts'
import { expectLoaderInsteadOf } from '@core-test/expect-loader.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const useXoSrUtilsMock = mockedExport(useXoSrUtils)

mockXoCollections('sr')

mockXoVmCollection()

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()

  useXoSrUtilsMock.mockReturnValue({ srStatusIcon: computed(() => objectIcon('sr', 'connected')) })
})

type VmReplication = NonNullable<NonNullable<XoVmDashboard['backupsInfo']>['replication']>

function createReplication(overrides: Partial<VmReplication> = {}): VmReplication {
  return { id: 'vm-1' as VmReplication['id'], timestamp: 1660000000000, ...overrides }
}

function createDashboard(replication: VmReplication | undefined): XoVmDashboard {
  return { backupsInfo: { replication } } as XoVmDashboard
}

function mountReplication(props: DashboardCardProps<'vmDashboard', XoVmDashboard> = {}) {
  return mount(VmDashboardBackupReplication, {
    props: { vmDashboard: createDashboard(createReplication()), hasError: false, ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsDashboardCardStates(mountReplication, {
  dashboardProp: 'vmDashboard',
  title: t('backup:last-replication'),
  missing: { 'the replication': createDashboard(undefined) },
  findContent: findRowLabels,
  hasErrorState: true,
})

it('shows a loader instead of the replication while the storage repositories are still loading', () => {
  HOLD_LOADING.SRs()

  expectLoaderInsteadOf(mountReplication(), findRowLabels)
})

it('shows an error message when the storage repositories failed to load', () => {
  xoCollectionsMock.hasSrFetchError.value = true

  const wrapper = mountReplication()

  expect(findStateHeroTexts(wrapper)).toEqual([t('error-no-data')])
})

it('reports that the VM is not replicated when the replication is empty', () => {
  const wrapper = mountReplication({ vmDashboard: createDashboard({} as VmReplication) })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-replicated-vm')])
})

it('shows the replicated VM, its date and its storage repository', () => {
  const replication = createReplication({ sr: 'sr-1' as VmReplication['sr'] })
  vmCollectionMock.vms.value = [createVm({ id: replication.id, name_label: 'Web server' })]
  xoCollectionsMock.srs.value = [createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Backup SR' })]

  const wrapper = mountReplication({ vmDashboard: createDashboard(replication) })

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('vm')]: 'Web server',
    [t('date')]: formatDateTime(replication.timestamp),
    [t('storage-repository')]: 'Backup SR',
  })
})

it('leaves the VM and storage repository rows empty when neither can be resolved', () => {
  const wrapper = mountReplication()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('vm')]: '', [t('storage-repository')]: '' })
})
