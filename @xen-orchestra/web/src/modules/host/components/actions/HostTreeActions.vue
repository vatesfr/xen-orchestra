<template>
  <HostMoreActions :host />
</template>

<script setup lang="ts">
import HostMoreActions from '@/modules/host/components/actions/HostMoreActions.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

defineProps<{
  host: FrontXoHost
}>()
</script>
