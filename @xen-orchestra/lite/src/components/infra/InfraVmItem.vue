<template>
  <VtsTreeItem v-if="vm !== undefined" ref="rootElement" expanded class="infra-vm-item">
    <UiTreeItemLabel v-if="isVisible" :route="{ name: '/vm/[uuid]', params: { uuid: vm.uuid } }" no-indent>
      {{ vm.name_label || '(VM)' }}
      <template #icon>
        <VtsObjectIcon size="medium" :state="vmPowerState!" type="vm" />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import type { VM_POWER_STATE, XenApiVm } from '@vates/types'
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
