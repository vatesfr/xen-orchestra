<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:pause" :busy="isRunning" @click="pause">
    {{ t('pause') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmPauseJob } from '@/jobs/vm/vm-pause.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: pause, canRun, isRunning } = useVmPauseJob(() => [vm])
</script>
