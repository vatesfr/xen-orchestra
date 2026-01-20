<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:reboot" :busy="isRunning" @click="reboot">
    {{ t('action:reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmRebootJob } from '@/jobs/vm/vm-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: reboot, canRun, isRunning } = useVmRebootJob(() => [vm])
</script>
