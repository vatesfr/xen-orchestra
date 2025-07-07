<template>
  <VtsTreeItem v-if="vm !== undefined" ref="rootElement" expanded class="infra-vm-item">
    <UiTreeItemLabel v-if="isVisible" :route="{ name: 'vm.default', params: { uuid: vm.uuid } }" no-indent>
      {{ vm.name_label || '(VM)' }}
      <template #icon>
        <UiObjectIcon size="medium" :state="vmPowerState!" type="vm" />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

const { vmOpaqueRef } = defineProps<{
  vmOpaqueRef: XenApiVm['$ref']
}>()

const { getByOpaqueRef } = useVmStore().subscribe()
const vm = computed(() => getByOpaqueRef(vmOpaqueRef))
const rootElement = ref()
const isVisible = ref(false)

const { stop } = useIntersectionObserver(rootElement, ([entry]) => {
  if (entry.isIntersecting) {
    isVisible.value = true
    stop()
  }
})

const vmPowerState = computed(() => vm.value?.power_state.toLowerCase() as Lowercase<VM_POWER_STATE> | undefined)
</script>
