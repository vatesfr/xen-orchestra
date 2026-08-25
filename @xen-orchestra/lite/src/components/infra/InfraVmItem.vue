<template>
  <VtsTreeItem v-if="vm !== undefined" ref="rootElement" expanded class="infra-vm-item" :node-id="`vm:${vm.uuid}`">
    <UiTreeItemLabel v-if="isVisible" :route="{ name: '/vm/[uuid]', params: { uuid: vm.uuid } }" no-indent>
      {{ vm.name_label || '(VM)' }}
      <template #icon>
        <VtsObjectIcon size="medium" :state="vmPowerState!" type="vm" />
      </template>
      <template #addons>
        <UiLoader v-if="isChangingState" v-tooltip="{ placement: 'top', content: currentOperation }" />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              accent="brand"
              icon="action:more-actions"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <VmTreeActions :vm-opaque-ref />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmTreeActions from '@/modules/vm/components/actions/VmTreeActions.vue'
import { useVmUtils } from '@/modules/vm/composables/vm-utils.composable.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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

const { isChangingState, currentOperation } = useVmUtils(vm)
</script>
