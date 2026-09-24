import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdiVbdRunningAction = 'detach' | 'connect' | 'disconnect' | undefined

export function useVdiVbdActions(rawVdi: MaybeRefOrGetter<FrontXoVdi>, rawVm: MaybeRefOrGetter<FrontXoVm | undefined>) {
  const vdi = toComputed(rawVdi)
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const { useGetVbdsByIds } = useXoVbdCollection()

  const vbds = useGetVbdsByIds(() => vdi.value.$VBDs)

  const vmVbds = computed(() => vbds.value.filter(vbd => vbd.VM === vm.value?.id).slice(0, 1))

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

  const connectionAction = useMapper(
    () => (vmVbds.value[0]?.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
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

  const detachAction = computed<ActionItem>(() => ({
    label: t('action:detach-vdi'),
    hint: deleteVbdsErrorMessage.value,
    icon: 'action:detach',
    onClick: () => deleteVbds(),
    disabled: !canDeleteVbds.value,
    busy: isDeletingVbds.value,
  }))

  const runningAction = computed<VdiVbdRunningAction>(() => {
    if (isDeletingVbds.value) {
      return 'detach'
    }
    if (isConnectingVbds.value) {
      return 'connect'
    }
    if (isDisconnectingVbds.value) {
      return 'disconnect'
    }
    return undefined
  })

  return { connectionAction, detachAction, runningAction }
}
