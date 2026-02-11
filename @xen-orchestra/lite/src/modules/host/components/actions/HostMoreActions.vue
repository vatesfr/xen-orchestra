<template>
  <HostDownloadButton :host-ip="host.address" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'

const { host } = defineProps<{
  host: XenApiHost
}>()
</script>
