<template>
  <HostDownloadButton :host-opaque-ref />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'

defineProps<{
  hostOpaqueRef: XenApiHost['$ref']
}>()
</script>
