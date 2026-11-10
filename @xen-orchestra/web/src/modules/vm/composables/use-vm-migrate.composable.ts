import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmMigrationBlocked } from '@/modules/vm/utils/xo-vm.util.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useVmMigrate(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const payload = ref<VmMigratePayload | undefined>(undefined)

  const {
    run,
    canRun: canMigrateVm,
    isRunning: isMigratingVm,
    errorMessage: migrateVmErrorMessage,
  } = useXoVmMigrateJob(() => vm.value, payload)

  const { xo5VmAdvancedHref } = useXoVmUtils(vm)

  const isMigrationBlocked = computed(() => isVmMigrationBlocked(vm.value))

  const { open: openBlockedModal } = useBlockedModal()

  const { open: openMigrateDrawer } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmMigrateDrawer.vue'),
    events: {
      onConfirm: (migratePayload: VmMigratePayload) => {
        payload.value = migratePayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    vm: vm.value,
  }))

  function migrateVm() {
    if (isMigrationBlocked.value) {
      return openBlockedModal({ props: { blockedOperation: 'migrate_send', href: xo5VmAdvancedHref.value } })
    }

    return openMigrateDrawer({ props })
  }

  return {
    migrateVm,
    canMigrateVm,
    isMigratingVm,
    isMigrationBlocked,
    migrateVmErrorMessage,
  }
}
