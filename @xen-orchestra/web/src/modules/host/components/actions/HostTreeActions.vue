<template>
  <HostDownloadButton :host-id="host.id" />
  <HostDisableButton v-if="host.enabled" :host />
  <HostEnableButton v-else :host />
</template>

<script setup lang="ts">
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

defineProps<{
  host: FrontXoHost
}>()
</script>
