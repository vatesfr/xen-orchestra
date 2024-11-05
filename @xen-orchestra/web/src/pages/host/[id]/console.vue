<template>
  <p v-if="!isHostConsoleAvailable" class="typo h5-medium">{{ $t('power-on-host-for-console') }}</p>
  <RemoteConsole v-else :url />
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import RemoteConsole from '@core/components/console/RemoteConsole.vue'
import { computed } from 'vue'

const props = defineProps<{
  host: XoHost
}>()

const url = computed(
  () => new URL(`/api/consoles/${props.host.controlDomain}`, window.location.origin.replace(/^http/, 'ws'))
)

const isHostConsoleAvailable = computed(() => props.host.power_state === 'Running')
</script>
