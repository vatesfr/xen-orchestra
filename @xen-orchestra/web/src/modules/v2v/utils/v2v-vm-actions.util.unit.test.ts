import { getV2vVmMenuActions } from '@/modules/v2v/utils/v2v-vm-actions.util.ts'
import { createActionItem } from '@/test/create-action-item.ts'

const EDIT_ACTION = createActionItem({ label: 'Edit settings' })

const REMOVE_ACTION = createActionItem({ label: 'Remove from list' })

const DELETE_ACTION = createActionItem({ label: 'Delete' })

describe('getV2vVmMenuActions', () => {
  it('leads with the main action, a separator above the first other action only', () => {
    expect(getV2vVmMenuActions(EDIT_ACTION, [REMOVE_ACTION, DELETE_ACTION])).toEqual([
      EDIT_ACTION,
      { ...REMOVE_ACTION, separator: true },
      DELETE_ACTION,
    ])
  })

  it('lists the other actions as they are without a main action', () => {
    expect(getV2vVmMenuActions(undefined, [REMOVE_ACTION, DELETE_ACTION])).toEqual([REMOVE_ACTION, DELETE_ACTION])
  })

  it('has only the main action without other actions', () => {
    expect(getV2vVmMenuActions(EDIT_ACTION, [])).toEqual([EDIT_ACTION])
  })
})
