<template>
  <TreeItem v-if="vm !== undefined" ref="rootElement" expanded class="infra-vm-item">
    <TreeItemLabel v-if="isVisible" :route="{ name: 'vm.console', params: { uuid: vm.uuid } }" no-indent>
      {{ vm.name_label || '(VM)' }}
      <template #icon>
        <ObjectIcon :state="vmPowerState!" type="vm" />
      </template>
    </TreeItemLabel>
  </TreeItem>
</template>

<script lang="ts" setup>
import type { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

const props = defineProps<{
  vmOpaqueRef: XenApiVm['$ref']
}>()

const { getByOpaqueRef } = useVmStore().subscribe()
const vm = computed(() => getByOpaqueRef(props.vmOpaqueRef))
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
