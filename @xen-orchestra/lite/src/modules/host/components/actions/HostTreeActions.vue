<template>
  <HostMoreActions :host />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostMoreActions from '@/modules/host/components/actions/HostMoreActions.vue'

defineProps<{
  host: XenApiHost
}>()
</script>
