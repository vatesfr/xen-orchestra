<template>
  <p v-if="!isVmConsoleAvailable" class="typo h5-medium">{{ $t('power-on-for-console') }}</p>
  <RemoteConsole v-else :url />
</template>

<script lang="ts" setup>
import type { XoVm } from '@/types/xo/vm.type'
import RemoteConsole from '@core/components/console/RemoteConsole.vue'
import { computed } from 'vue'

const props = defineProps<{
  vm: XoVm
}>()

const url = computed(() => new URL(`/api/consoles/${props.vm.id}`, window.location.origin.replace(/^http/, 'ws')))

const isVmConsoleAvailable = computed(() => props.vm.power_state === 'Running' && props.vm.other.disable_pv_vnc !== '1')
</script>
