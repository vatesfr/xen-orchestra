<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :busy="isMigrating"
    :disabled="isDisabled"
    icon="fa:route"
    :hint="disabledReason"
    @click="openMigrateModal()"
  >
    {{ t('action:migrate') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVmMigration } from '@/composables/vm-migration.composable.ts'
import { areSomeVmOperationAllowed, isVmOperationPending } from '@/libs/vm.ts'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { selectedRefs, isSingleAction } = defineProps<{
  selectedRefs: XenApiVm['$ref'][]
  isSingleAction?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRefs } = useVmStore().subscribe()

const isMigratable = computed(() =>
  getByOpaqueRefs(selectedRefs).some(vm =>
    areSomeVmOperationAllowed(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const isMigrating = computed(() =>
  getByOpaqueRefs(selectedRefs).some(vm =>
    isVmOperationPending(vm, [VM_OPERATION.POOL_MIGRATE, VM_OPERATION.MIGRATE_SEND])
  )
)

const isDisabled = useDisabled(() => !isMigratable.value)

const disabledReason = computed(() =>
  selectedRefs.length > 0 && !isMigratable.value
    ? t(isSingleAction ? 'this-vm-cant-be-migrated' : 'no-selected-vm-can-be-migrated')
    : undefined
)

const { selectedHost, availableHosts, isValid, migrate } = useVmMigration(() => selectedRefs)

const { open: openModal } = useOverlay({
  component: () => import('@/components/modals/VmMigrateModal.vue'),
  events: {
    onConfirm: async host => {
      selectedHost.value = host

      if (!isValid.value) {
        return KEEP_OVERLAY_OPEN
      }

      await migrate()
    },
    onCancel: true,
  },
})

const modalProps = reactiveComputed(() => ({
  count: selectedRefs.length,
  availableHosts: availableHosts.value,
}))

function openMigrateModal() {
  return openModal({ props: modalProps })
}
</script>
