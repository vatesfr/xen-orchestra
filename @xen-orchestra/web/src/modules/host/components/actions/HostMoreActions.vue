<template>
  <HostDownloadButton :host-ip="host.address" />
</template>

<script setup lang="ts">
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import type { XoHost } from '@vates/types'

const { host } = defineProps<{
  host: XoHost
}>()
</script>
