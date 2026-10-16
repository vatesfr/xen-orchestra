import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmMigrationBlocked } from '@/modules/vm/utils/xo-vm.util.ts'
import { getErrorCode, getErrorTaskId } from '@/shared/composables/xo-task-utils.composable.ts'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const VM_INCOMPATIBLE_WITH_THIS_HOST = 'VM_INCOMPATIBLE_WITH_THIS_HOST'

export function useVmMigrate(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

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

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message
    }

    return String(error)
  }

  const { open: openBlockedModal } = useBlockedModal()

  const { open: openMigrateErrorModal } = useOverlay({
    component: () => import('@/modules/vm/components/modal/VmMigrateErrorModal.vue'),
    events: {
      onClose: true,
    },
  })

  const { open: openForceMigrateModal } = useActionModal()

  function showMigrateError(migratedVm: FrontXoVm, error: unknown) {
    console.error(`Failed to migrate VM ${migratedVm.name_label}:`, error)

    void openMigrateErrorModal({
      props: {
        title: t('unable-to-migrate-vm', { name: migratedVm.name_label }),
        error: getErrorMessage(error),
        vmId: migratedVm.id,
        taskId: getErrorTaskId(error),
      },
    })
  }

  function forceMigration(migratedVm: FrontXoVm) {
    if (payload.value === undefined) {
      return
    }

    payload.value = { ...payload.value, force: true }

    void runMigration(migratedVm)
  }

  async function runMigration(migratedVm: FrontXoVm) {
    try {
      await run()
    } catch (error: unknown) {
      const isIncompatibleHost = getErrorCode(error) === VM_INCOMPATIBLE_WITH_THIS_HOST
      const isAlreadyForced = payload.value?.force === true

      if (isIncompatibleHost && !isAlreadyForced) {
        return openForceMigrateModal({
          props: {
            object: 'vm',
            action: 'force-migrate',
            vmName: migratedVm.name_label,
            accent: 'warning',
            icon: 'status:warning-picto',
          },
          events: {
            onConfirm: () => forceMigration(migratedVm),
          },
        })
      }

      showMigrateError(migratedVm, error)
    }
  }

  const { open: openMigrateDrawer } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmMigrateDrawer.vue'),
    events: {
      onConfirm: (migratePayload: VmMigratePayload) => {
        payload.value = migratePayload

        void runMigration(vm.value)
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
