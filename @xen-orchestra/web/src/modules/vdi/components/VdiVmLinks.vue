<template>
  <div class="vdi-vm-links">
    <UiLink
      v-for="vm in vms"
      :key="vm.id"
      size="small"
      :icon="objectIcon('vm', toLower(vm.power_state))"
      :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
    >
      {{ vm.name_label }}
    </UiLink>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'

defineProps<{
  vms: FrontXoVm[]
}>()
</script>

<style scoped lang="postcss">
.vdi-vm-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
