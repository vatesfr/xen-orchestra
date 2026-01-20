<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:plug" :busy="isRunning" @click="hard_shutdown">
    {{ t('action:force-shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmForceShutdownJob } from '@/jobs/vm/vm-force-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: hard_shutdown, canRun, isRunning } = useVmForceShutdownJob(() => [vm])
</script>
