<template>
  <HostDownloadButton :host-ip="host.address" />
</template>

<script setup lang="ts">
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

const { host } = defineProps<{
  host: FrontXoHost
}>()
</script>
