<template>
  <MenuItem
    v-tooltip="areSomeVmsInExecution && $t('selected-vms-in-execution')"
    :disabled="isDisabled"
    :icon="faTrashCan"
    @click="openDeleteModal"
  >
    {{ $t('delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@/components/menu/MenuItem.vue'
import { useModal } from '@/composables/modal.composable'
import { vTooltip } from '@/directives/tooltip.directive'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { getByOpaqueRef: getVm } = useVmCollection()

const vms = computed<XenApiVm[]>(() => props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))

const areSomeVmsInExecution = computed(() => vms.value.some(vm => vm.power_state !== VM_POWER_STATE.HALTED))

const isDisabled = computed(() => vms.value.length === 0 || areSomeVmsInExecution.value)

const openDeleteModal = () =>
  useModal(() => import('@/components/modals/VmDeleteModal.vue'), {
    vmRefs: props.vmRefs,
  })
</script>
