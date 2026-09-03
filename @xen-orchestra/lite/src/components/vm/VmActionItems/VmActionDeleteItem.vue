<template>
  <MenuItem
    v-tooltip="areSomeVmsInExecution && t('selected-vms-in-execution')"
    accent="brand"
    :disabled="isDisabled"
    icon="fa:trash"
    @click="openDeleteModal()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmRefs } = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVm } = useVmStore().subscribe()

const vms = computed<XenApiVm[]>(() => vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))

const areSomeVmsInExecution = computed(() => vms.value.some(vm => vm.power_state !== VM_POWER_STATE.HALTED))

const isDisabled = computed(() => vms.value.length === 0 || areSomeVmsInExecution.value)

const xenApi = useXenApiStore().getXapi()

const { open: openModal } = useDeleteModal()

function openDeleteModal() {
  return openModal({
    events: { onConfirm: () => xenApi.vm.delete(vmRefs) },
    props: {
      subject: t('n-vms', { n: vmRefs.length }),
      confirmLabel: t('action:delete-n-vms', { n: vmRefs.length }),
    },
  })
}
</script>
