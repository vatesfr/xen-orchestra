import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import { useVdiExport } from '@/modules/vdi/composables/use-vdi-export.composable.ts'
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
import { useVdiVmVbd } from '@/modules/vdi/composables/use-vdi-vm-vbd.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVdiRowActions(rawVdi: MaybeRefOrGetter<FrontXoVdi>, rawVm: MaybeRefOrGetter<FrontXoVm | undefined>) {
  const vdi = toComputed(rawVdi)
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const vbd = useVdiVmVbd(vdi, vm)

  const vmVbds = computed(() => (vbd.value ? [vbd.value] : []))

  const {
    connectVbds,
    disconnectVbds,
    canConnectVbds,
    canDisconnectVbds,
    isConnectingVbds,
    isDisconnectingVbds,
    connectVbdsErrorMessage,
    disconnectVbdsErrorMessage,
  } = useVbdConnection({ vbds: vmVbds, vm })

  const { deleteVbds, canDeleteVbds, isDeletingVbds, deleteVbdsErrorMessage } = useVbdDelete({ vbds: vmVbds, vm })

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

    if (isDeletingVbds.value) {
      return 'detach'
    }

    if (isConnectingVbds.value) {
      return 'connect'
    }

    if (isDisconnectingVbds.value) {
      return 'disconnect'
    }

    return 'none'
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

  const connectionAction = useMapper(
    () => (vbd.value?.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
    () => ({
      connect: {
        label: t('action:connect'),
        icon: 'action:connect',
        onClick: () => connectVbds(),
        disabled: !canConnectVbds.value,
        busy: isConnectingVbds.value,
        hint: canConnectVbds.value ? undefined : connectVbdsErrorMessage.value,
      } satisfies ActionItem,
      disconnect: {
        label: t('action:disconnect'),
        icon: 'action:disconnect',
        onClick: () => disconnectVbds(),
        disabled: !canDisconnectVbds.value,
        busy: isDisconnectingVbds.value,
        hint: canDisconnectVbds.value ? undefined : disconnectVbdsErrorMessage.value,
      } satisfies ActionItem,
    }),
    'connect'
  )

  const actions = computed(() => {
    const hasVm = vm.value !== undefined

    const items: (ActionItem | false)[] = [
      hasVm && connectionAction.value,
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
      hasVm && {
        label: t('action:detach-vdi'),
        hint: deleteVbdsErrorMessage.value,
        icon: 'action:detach',
        onClick: () => deleteVbds(),
        disabled: !canDeleteVbds.value,
        busy: isDeletingVbds.value,
      },
      {
        label: t('action:delete'),
        hint: deleteVdisErrorMessage.value,
        icon: 'action:delete',
        onClick: () => deleteVdis(),
        disabled: !canDeleteVdis.value,
        busy: isDeletingVdis.value,
        accent: 'danger',
      },
    ]

    return items.filter(item => item !== false)
  })

  return { actions, runningAction, busyMessage }
}
