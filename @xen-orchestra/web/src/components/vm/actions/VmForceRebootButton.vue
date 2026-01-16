<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:repeat" :busy="isRunning" @click="hard_reboot">
    {{ t('force-reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmForceRebootJob } from '@/jobs/vm/vm-force-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: hard_reboot, canRun, isRunning } = useVmForceRebootJob(() => [vm])
</script>
