import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import { useVdiExport } from '@/modules/vdi/composables/use-vdi-export.composable.ts'
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
import { useVdiVbdActions } from '@/modules/vdi/composables/use-vdi-vbd-actions.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVdiRowActions(rawVdi: MaybeRefOrGetter<FrontXoVdi>, rawVm: MaybeRefOrGetter<FrontXoVm | undefined>) {
  const vdi = toComputed(rawVdi)
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const vbdActions = useVdiVbdActions(vdi, vm)

  const { deleteVdis, canDeleteVdis, isDeletingVdis, deleteVdisErrorMessage } = useVdiDelete({
    vdis: () => [vdi.value],
    vm,
  })

  const { exportVdi, isExportingVdi } = useVdiExport(vdi)

  const { migrateVdi, canMigrateVdi, isMigratingVdi, migrateVdiErrorMessage } = useVdiMigrate(vdi)

  const runningAction = computed(() => {
    if (isMigratingVdi.value) {
      return 'migrate'
    }
    if (isDeletingVdis.value) {
      return 'delete'
    }
    return vbdActions.runningAction.value ?? 'none'
  })

  const busyMessage = useMapper(
    runningAction,
    () => ({
      migrate: t('job:vdi-migrate:in-progress'),
      delete: t('job:delete:in-progress'),
      detach: t('job:vdi-detach:in-progress'),
      disconnect: t('job:disconnect:in-progress'),
      connect: t('job:connect:in-progress'),
      none: undefined,
    }),
    'none'
  )

  const actions = computed((): ActionItem[] => [
    ...(vm.value ? [vbdActions.connectionAction.value] : []),
    {
      label: t('action:migrate-vdi-on-sr'),
      icon: 'action:migrate',
      hint: !canMigrateVdi.value ? migrateVdiErrorMessage.value : undefined,
      onClick: () => migrateVdi(),
      disabled: !canMigrateVdi.value,
      busy: isMigratingVdi.value,
    },
    {
      label: t('action:import-export'),
      icon: 'action:import-export',
      children: [
        {
          label: t('action:export-content'),
          icon: 'action:download',
          onClick: () => exportVdi(),
          busy: isExportingVdi.value,
        },
      ],
    },
    ...(vm.value ? [vbdActions.detachAction.value] : []),
    {
      label: t('action:delete'),
      hint: deleteVdisErrorMessage.value,
      icon: 'action:delete',
      onClick: () => deleteVdis(),
      disabled: !canDeleteVdis.value,
      busy: isDeletingVdis.value,
    },
  ])

  return { actions, runningAction, busyMessage }
}
