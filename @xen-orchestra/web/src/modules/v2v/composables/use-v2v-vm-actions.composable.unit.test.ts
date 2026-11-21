import {
  useV2vNewVmActions,
  useV2vNotFoundVmActions,
  useV2vResumedVmActions,
} from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import { V2V_NEW_STEP_VM, V2V_RESUMED_STEP_VM, V2V_NOT_FOUND_STEP_VM } from '@/test/create-v2v-mapping-step-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { vmDeleteMock, mockVmDelete } from '@/test/mock-vm-delete.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { toValue } from 'vue'

// The settings drawer is an overlay of the app, out of reach of a unit test
mockOverlay()

// The composable calls the REST API and opens modals
mockVmDelete()

beforeEach(() => {
  overlayMock.reset()
  vmDeleteMock.reset()
})

function mountNewVmActions() {
  const remove = vi.fn()

  // The drawer is opened from the mapping step, under the connection of the wizard
  const actions = mountComposableWithI18n(() => useV2vNewVmActions(V2V_NEW_STEP_VM, { updateVm: vi.fn(), remove }), {
    provide: v2vConnectionProvide(),
  })

  return { actions, remove }
}

function mountNotFoundVmActions() {
  const remove = vi.fn()

  const actions = mountComposableWithI18n(() => useV2vNotFoundVmActions(V2V_NOT_FOUND_STEP_VM, { remove }))

  return { actions, remove }
}

function mountResumedVmActions() {
  return mountComposableWithI18n(() => useV2vResumedVmActions(V2V_RESUMED_STEP_VM))
}

describe('useV2vNewVmActions', () => {
  it('offers to edit the settings of the VM', () => {
    const { actions } = mountNewVmActions()

    expect(actions.editAction).toMatchObject({ label: actions.t('action:edit-settings'), icon: 'action:edit' })
  })

  // What the drawer is opened with is told by the settings edit composable
  it('opens the settings drawer', () => {
    const { actions } = mountNewVmActions()

    actions.editAction.onClick()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledOnce()
  })
})

describe('useV2vResumedVmActions', () => {
  it('shows the settings edit disabled, locked since the first sync', () => {
    const actions = mountResumedVmActions()

    expect(actions.editAction).toMatchObject({
      label: actions.t('action:edit-settings'),
      icon: 'action:edit',
      disabled: true,
      hint: actions.t('v2v:locked-since-first-sync'),
    })
  })

  it('only offers to delete the import VM, as a dangerous action', () => {
    const actions = mountResumedVmActions()

    expect(actions.moreActions).toMatchObject([
      { label: actions.t('action:delete'), icon: 'action:delete', accent: 'danger', busy: false, disabled: false },
    ])
  })

  it('deletes the import VM of the resumed VM', () => {
    const [deleteAction] = mountResumedVmActions().moreActions

    deleteAction.onClick()

    expect(toValue(vmDeleteMock.useVmDelete.mock.lastCall?.[0])).toEqual([V2V_RESUMED_STEP_VM.importVm])
    expect(vmDeleteMock.deleteVms).toHaveBeenCalledOnce()
  })

  it('shows the deletion busy while the import VM is being deleted', () => {
    vmDeleteMock.setDeleting(true)

    expect(mountResumedVmActions().moreActions[0].busy).toBe(true)
  })

  it('disables the deletion, telling why, when the import VM cannot be deleted', () => {
    vmDeleteMock.setBlocked('Blocked operation')

    expect(mountResumedVmActions().moreActions[0]).toMatchObject({ disabled: true, hint: 'Blocked operation' })
  })
})

// A new VM and a VM gone from the source both leave the list, the only action of their menu
describe.each([
  ['useV2vNewVmActions', V2V_NEW_STEP_VM.id, mountNewVmActions],
  ['useV2vNotFoundVmActions', V2V_NOT_FOUND_STEP_VM.id, mountNotFoundVmActions],
])('%s', (_, id, mountActions) => {
  it('only offers to remove the VM from the list, as a dangerous action', () => {
    const { actions } = mountActions()

    expect(actions.moreActions).toMatchObject([
      { label: actions.t('action:remove-from-list'), icon: 'action:close-cancel-clear', accent: 'danger' },
    ])
  })

  it('removes the VM from the list through the caller', () => {
    const { actions, remove } = mountActions()

    actions.moreActions[0].onClick()

    expect(remove).toHaveBeenCalledExactlyOnceWith(id)
  })
})

// The menu of a VM opens on its first action: a separator sets an action apart in the row menu only
it.each([
  ['new', () => mountNewVmActions().actions.moreActions],
  ['resumed', () => mountResumedVmActions().moreActions],
  ['not found', () => mountNotFoundVmActions().actions.moreActions],
])('opens the menu of a %s VM without a separator', (_, getMoreActions) => {
  expect(getMoreActions().map(action => action.separator ?? false)).toEqual([false])
})
