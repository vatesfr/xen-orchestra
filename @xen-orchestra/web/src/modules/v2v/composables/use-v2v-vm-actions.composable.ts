import type {
  V2vMappingStepVm,
  V2vNewMappingStepVm,
  V2vNotFoundMappingStepVm,
  V2vResumedMappingStepVm,
} from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmMappingContext } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import { useV2vVmSettingsEdit } from '@/modules/v2v/composables/use-v2v-vm-settings-edit.composable.ts'
import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoV2vVm } from '@vates/types'
import { noop } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

// The caller confirms the removal, and knows what to show once the VM left the list
export type V2vVmRemove = (id: XoV2vVm['id']) => unknown

// The settings edit, if any, comes first, the other actions apart: the panel as a button, a row menu above a separator
export type V2vVmActionList = {
  mainAction?: LeafActionItem
  moreActions: LeafActionItem[]
}

// Every kind with a mapping shows its settings edit, a resumed VM's one disabled
function useEditSettingsAction(getState: () => Pick<LeafActionItem, 'onClick' | 'disabled' | 'hint'>) {
  const { t } = useI18n()

  return computed((): LeafActionItem => ({ label: t('action:edit-settings'), icon: 'action:edit', ...getState() }))
}

// A VM leaves the list without anything deleted
function useRemoveAction(vm: ComputedRef<V2vMappingStepVm>, remove: V2vVmRemove) {
  const { t } = useI18n()

  return computed(
    (): LeafActionItem => ({
      label: t('action:remove-from-list'),
      icon: 'action:close-cancel-clear',
      accent: 'danger',
      onClick: () => remove(vm.value.id),
    })
  )
}

// Each kind of VM has its own actions, a composable each: a resumed VM has an import VM to delete, the other kinds have
// none. The component calling one is chosen by `v-if` on the kind of its VM, which changes once the import VM is
// deleted. The menu actions carry no separator: the panel menu opens on them, a row menu sets them apart itself
export function useV2vNewVmActions(
  rawVm: MaybeRefOrGetter<V2vNewMappingStepVm>,
  { updateVm, remove }: Pick<V2vVmMappingContext, 'updateVm'> & { remove: V2vVmRemove }
) {
  const vm = toComputed(rawVm)

  const { editVmSettings } = useV2vVmSettingsEdit(() => vm.value.vm, { list: () => vm.value.list, updateVm })

  const editAction = useEditSettingsAction(() => ({ onClick: () => editVmSettings() }))

  const removeAction = useRemoveAction(vm, remove)

  const moreActions = computed(() => [removeAction.value])

  return { editAction, moreActions }
}

// The mapping of a resumed VM is locked since its first sync: deleting its import VM makes it new again
export function useV2vResumedVmActions(rawVm: MaybeRefOrGetter<V2vResumedMappingStepVm>) {
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const { deleteVm, isDeletingVm } = useVmDelete(() => vm.value.importVm)

  const editAction = useEditSettingsAction(() => ({
    onClick: noop,
    disabled: true,
    hint: t('v2v:locked-since-first-sync'),
  }))

  const deleteAction = computed(
    (): LeafActionItem => ({
      label: t('action:delete'),
      icon: 'action:delete',
      accent: 'danger',
      onClick: () => deleteVm(),
      busy: isDeletingVm.value,
    })
  )

  const moreActions = computed(() => [deleteAction.value])

  return { editAction, moreActions }
}

// A VM gone from the source has no mapping to edit
export function useV2vNotFoundVmActions(
  rawVm: MaybeRefOrGetter<V2vNotFoundMappingStepVm>,
  { remove }: { remove: V2vVmRemove }
) {
  const vm = toComputed(rawVm)

  const removeAction = useRemoveAction(vm, remove)

  const moreActions = computed(() => [removeAction.value])

  return { moreActions }
}
