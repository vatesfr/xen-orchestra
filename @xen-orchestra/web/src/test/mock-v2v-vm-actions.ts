import type * as V2vVmActions from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { computed } from 'vue'

function createMoreActions(label: string) {
  return computed(() => [createActionItem({ label, accent: 'danger' })])
}

// The action composables open the settings drawer or delete an import VM through the REST API: a component test gets
// fake actions instead, each call its own. Reset in `beforeEach`
export const v2vVmActionsMock = {
  useV2vNewVmActions: vi.fn<typeof V2vVmActions.useV2vNewVmActions>(() => ({
    editAction: computed(() => createActionItem({ label: 'Edit settings', icon: 'action:edit' })),
    moreActions: createMoreActions('Remove from list'),
  })),
  useV2vResumedVmActions: vi.fn<typeof V2vVmActions.useV2vResumedVmActions>(() => ({
    editAction: computed(() =>
      createActionItem({ label: 'Edit settings', disabled: true, hint: 'Locked since the first sync' })
    ),
    moreActions: createMoreActions('Delete'),
  })),
  useV2vNotFoundVmActions: vi.fn<typeof V2vVmActions.useV2vNotFoundVmActions>(() => ({
    moreActions: createMoreActions('Remove from list'),
  })),
  reset() {
    this.useV2vNewVmActions.mockClear()
    this.useV2vResumedVmActions.mockClear()
    this.useV2vNotFoundVmActions.mockClear()
  },
}

// Use as `vi.mock(import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'), () => import('@/test/mock-v2v-vm-actions.ts'))`
export const { useV2vNewVmActions, useV2vResumedVmActions, useV2vNotFoundVmActions } = v2vVmActionsMock
