<template>
  <MenuItem
    v-tooltip="areSomeVmsInExecution && t('selected-vms-in-execution')"
    :disabled="isDisabled"
    icon="fa:trash"
    @click="openDeleteModal"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useModal } from '@core/packages/modal/use-modal.ts'
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

const openDeleteModal = useModal({
  component: import('@core/components/modal/VtsDeleteModal.vue'),
  props: { count: computed(() => vmRefs.length), object: 'vm' },
  onConfirm: () => xenApi.vm.delete(vmRefs),
})
</script>
