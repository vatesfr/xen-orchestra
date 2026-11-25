import { createJobStub, type JobResultState } from '@/test/create-job-result.ts'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import type { VueWrapper } from '@vue/test-utils'
import { toValue } from 'vue'

/**
 * The stubs of a change-state job (`createJobStub`), one per targeted state: `use`, given to the mocked job,
 * returns the stub of the state it receives, as a getter, as its second argument.
 */
export function createChangeStateJobStubs() {
  const enable = createJobStub()
  const disable = createJobStub()

  return {
    enable,
    disable,
    use: (_targets: unknown, enabled: unknown) => (toValue(enabled) ? enable.use() : disable.use()),
  }
}

// The actions of a `VtsTableBulkActions` opening on a change state menu: that menu, its children, then the others
export function findBulkActions(wrapper: Pick<VueWrapper, 'getComponent'>) {
  const [changeState, ...actions] = wrapper.getComponent(VtsTableBulkActions).props('actions') as [
    GroupActionItem,
    ...ActionItem[],
  ]

  return { changeState, changeStateChildren: changeState.children, actions }
}

type NoSelectionCase = {
  // Mounts the bulk actions without selection
  mountEmpty: () => Pick<VueWrapper, 'getComponent'>
  // What every action tells without selection
  hint: string
  // The jobs of the actions after the change state menu, and the error each would give
  jobErrors: [job: { setState: (state: JobResultState) => void }, errorMessage: string][]
  // The name of the test of those actions
  actionsTestName: string
}

/**
 * Registers the tests every bulk actions opening on a change state menu shares without selection: every action is
 * disabled, telling there is no selection rather than the error of its job.
 */
export function itExplainsNoSelection({ mountEmpty, hint, jobErrors, actionsTestName }: NoSelectionCase) {
  it('disables the change state menu and explains why', () => {
    expect(findBulkActions(mountEmpty()).changeState).toMatchObject({ disabled: true, hint })
  })

  it(actionsTestName, () => {
    jobErrors.forEach(([job, errorMessage]) => job.setState({ canRun: false, errorMessage }))

    const { actions } = findBulkActions(mountEmpty())

    expect(actions).toHaveLength(jobErrors.length)

    for (const action of actions) {
      expect(action).toMatchObject({ disabled: true, hint })
    }
  })
}
