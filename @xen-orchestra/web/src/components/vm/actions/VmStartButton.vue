<template>
  <MenuItem icon="fa:play" :busy="isRunning" :disabled="!canRun" @click="start">
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmStartJob } from '@/jobs/vm/vm-start.job'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: start, canRun, isRunning } = useVmStartJob(() => [vm])
</script>
