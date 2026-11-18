import VmsBulkActions from '@/modules/vm/components/list/VmsBulkActions.vue'
import type { useVmBulkPowerStateActions } from '@/modules/vm/composables/use-vm-bulk-power-state-actions.composable.ts'
import type { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import type { useXoVmSnapshotJob } from '@/modules/vm/jobs/xo-vm-snapshot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { mount } from '@vue/test-utils'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

const { snapshot, deleteVms, useSnapshotJob, useDelete, powerStateActions } = vi.hoisted(() => ({
  snapshot: vi.fn(),
  deleteVms: vi.fn(),
  useSnapshotJob: vi.fn(),
  useDelete: vi.fn(),
  powerStateActions: [] as ActionItem[],
}))

// The jobs and composables call the REST API and open SSE subscriptions
vi.mock(import('@/modules/vm/composables/use-vm-bulk-power-state-actions.composable.ts'), () => ({
  useVmBulkPowerStateActions: (() => ({
    powerStateActions: ref(powerStateActions),
  })) as unknown as typeof useVmBulkPowerStateActions,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-snapshot.job.ts'), () => ({
  useXoVmSnapshotJob: useSnapshotJob as unknown as typeof useXoVmSnapshotJob,
}))

vi.mock(import('@/modules/vm/composables/use-vm-delete.composable.ts'), () => ({
  useVmDelete: ((vms: unknown) => {
    const { run, canRun, isRunning, errorMessage } = useDelete(vms)

    return { deleteVms: run, canDeleteVms: canRun, isDeletingVms: isRunning, deleteVmsErrorMessage: errorMessage }
  }) as unknown as typeof useVmDelete,
}))

beforeEach(() => {
  snapshot.mockReset()
  deleteVms.mockReset()
  useSnapshotJob.mockReset().mockReturnValue(createJobResult(snapshot))
  useDelete.mockReset().mockReturnValue(createJobResult(deleteVms))
  powerStateActions.splice(0, Infinity, createActionItem({ label: 'Start' }), createActionItem({ label: 'Pause' }))
})

const firstVm = createVm({ id: 'vm-1' as FrontXoVm['id'] })
const secondVm = createVm({ id: 'vm-2' as FrontXoVm['id'] })

function mountBulkActions(vms: FrontXoVm[] = [firstVm]) {
  return mount(VmsBulkActions, {
    props: { vms },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  const [changeState, snapshotAction, deleteAction] = wrapper.getComponent(VtsTableBulkActions).props('actions') as [
    GroupActionItem,
    ActionItem,
    ActionItem,
  ]

  return { changeState, snapshotAction, deleteAction }
}

function getJobVmIds(useJob: typeof useSnapshotJob) {
  return toValue(useJob.mock.calls[0][0] as MaybeRefOrGetter<FrontXoVm[]>).map(vm => vm.id)
}

describe('without selection', () => {
  it('disables the change state menu and explains why', () => {
    const { changeState } = findActions(mountBulkActions([]))

    expect(changeState).toMatchObject({ disabled: true, hint: t('no-vm-selected') })
  })

  it('explains why snapshot and delete cannot run', () => {
    useSnapshotJob.mockReturnValue(createJobResult(snapshot, { canRun: false, errorMessage: 'No VMs to snapshot' }))
    useDelete.mockReturnValue(createJobResult(deleteVms, { canRun: false, errorMessage: 'No VMs to delete' }))

    const { snapshotAction, deleteAction } = findActions(mountBulkActions([]))

    expect(snapshotAction).toMatchObject({ disabled: true, hint: t('no-vm-selected') })
    expect(deleteAction).toMatchObject({ disabled: true, hint: t('no-vm-selected') })
  })
})

describe('with a selection', () => {
  it('lists the power state actions in the change state menu', () => {
    const { changeState } = findActions(mountBulkActions())

    expect(changeState).toMatchObject({ disabled: false, hint: undefined, children: powerStateActions })
  })

  it('snapshots and deletes the whole selection', () => {
    mountBulkActions([firstVm, secondVm])

    expect(getJobVmIds(useSnapshotJob)).toEqual([firstVm.id, secondVm.id])
    expect(getJobVmIds(useDelete)).toEqual([firstVm.id, secondVm.id])
  })

  it('runs snapshot and delete in one click', () => {
    const { snapshotAction, deleteAction } = findActions(mountBulkActions())

    snapshotAction.onClick?.()
    deleteAction.onClick?.()

    expect(snapshot).toHaveBeenCalledOnce()
    expect(deleteVms).toHaveBeenCalledOnce()
  })

  it('reflects the state of the snapshot and delete jobs', () => {
    useSnapshotJob.mockReturnValue(
      createJobResult(snapshot, { canRun: false, isRunning: true, errorMessage: 'Snapshot in progress…' })
    )
    useDelete.mockReturnValue(createJobResult(deleteVms, { canRun: false, errorMessage: 'VM deletion is blocked' }))

    const { snapshotAction, deleteAction } = findActions(mountBulkActions())

    expect(snapshotAction).toMatchObject({ busy: true, disabled: true, hint: 'Snapshot in progress…' })
    expect(deleteAction).toMatchObject({ disabled: true, hint: 'VM deletion is blocked', accent: 'danger' })
  })
})
