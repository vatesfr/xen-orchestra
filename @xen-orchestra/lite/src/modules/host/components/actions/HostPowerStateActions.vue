<template>
  <HostRebootButton :host />
  <HostForceRebootButton :host />
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostForceRebootButton from '@/modules/host/components/actions/reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'

defineProps<{ host: XenApiHost }>()
</script>
