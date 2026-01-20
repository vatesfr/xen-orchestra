<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:stop" :busy="isRunning" @click="shutdown">
    {{ t('action:shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmShutdownJob } from '@/jobs/vm/vm-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: shutdown, canRun, isRunning } = useVmShutdownJob(() => [vm])
</script>
