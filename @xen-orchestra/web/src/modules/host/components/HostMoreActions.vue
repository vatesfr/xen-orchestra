<template>
  <HostDisableButton :host />
  <HostEnableButton :host />
</template>

<script lang="ts" setup>
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

defineProps<{
  host: FrontXoHost
}>()
</script>
