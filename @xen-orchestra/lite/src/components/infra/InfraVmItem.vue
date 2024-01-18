<template>
  <li v-if="vm !== undefined" ref="rootElement" class="infra-vm-item">
    <InfraItemLabel v-if="isVisible" :icon="faDisplay" :route="{ name: 'vm.console', params: { uuid: vm.uuid } }">
      {{ vm.name_label || '(VM)' }}
      <template #actions>
        <InfraAction>
          <PowerStateIcon :state="vm.power_state" />
        </InfraAction>
      </template>
    </InfraItemLabel>
  </li>
</template>

<script lang="ts" setup>
import InfraAction from '@/components/infra/InfraAction.vue'
import InfraItemLabel from '@/components/infra/InfraItemLabel.vue'
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

const props = defineProps<{
  vmOpaqueRef: XenApiVm['$ref']
}>()

const { getByOpaqueRef } = useVmCollection()
const vm = computed(() => getByOpaqueRef(props.vmOpaqueRef))
const rootElement = ref()
const isVisible = ref(false)

const { stop } = useIntersectionObserver(rootElement, ([entry]) => {
  if (entry.isIntersecting) {
    isVisible.value = true
    stop()
  }
})
</script>

<style lang="postcss" scoped>
.infra-action {
  color: var(--color-purple-d60);

  &.running {
    color: var(--color-green-base);
  }

  &.paused {
    color: var(--color-grey-300);
  }

  &.suspended {
    color: var(--color-purple-d20);
  }
}
</style>
