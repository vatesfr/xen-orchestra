<template>
  <HostRebootButton :host />
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'

const { host } = defineProps<{
  host: XenApiHost
}>()
</script>
