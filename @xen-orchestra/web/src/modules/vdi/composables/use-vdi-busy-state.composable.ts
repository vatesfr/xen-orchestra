import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVdiBusyState(options: {
  vdi: MaybeRefOrGetter<FrontXoVdi>
  vbd: MaybeRefOrGetter<FrontXoVbd | undefined>
  vm: MaybeRefOrGetter<FrontXoVm | undefined>
}) {
  const { t } = useI18n()

  const vdi = toComputed(options.vdi)
  const vbd = toComputed(options.vbd)
  const vm = toComputed(options.vm)

  const vbds = computed(() => (vbd.value ? [vbd.value] : []))

  const { isConnectingVbds, isDisconnectingVbds } = useVbdConnection({ vbds, vm })

  const { isDeletingVbds } = useVbdDelete({ vbds, vm })

  const { isDeletingVdis } = useVdiDelete({ vdis: () => [vdi.value], vm })

  const { isMigratingVdi } = useVdiMigrate(vdi)

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

  const isBusy = computed(() => runningAction.value !== 'none')

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

  return { isBusy, busyMessage }
}
