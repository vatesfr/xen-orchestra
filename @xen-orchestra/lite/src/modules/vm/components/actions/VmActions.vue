<template>
  <VmMoreActions :vm layout="change-state-submenu" />
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'

defineProps<{
  vm: XenApiVm
}>()
</script>
