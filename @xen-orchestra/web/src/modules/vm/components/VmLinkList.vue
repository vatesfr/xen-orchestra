<template>
  <UiLinkList variant="vertical">
    <UiLink
      v-for="vm in vms"
      :key="vm.id"
      size="small"
      :icon="getVmIcon(vm)"
      :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
    >
      {{ vm.name_label }}
    </UiLink>
  </UiLinkList>
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'

defineProps<{
  vms: FrontXoVm[]
}>()
</script>
