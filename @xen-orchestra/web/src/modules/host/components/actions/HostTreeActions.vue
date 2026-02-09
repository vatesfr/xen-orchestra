<template>
  <HostMoreActions :host />
</template>

<script setup lang="ts">
import HostMoreActions from '@/modules/host/components/actions/HostMoreActions.vue'
import type { XoHost } from '@vates/types'

defineProps<{
  host: XoHost
}>()
</script>
