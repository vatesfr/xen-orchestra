<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:moon" :busy="isRunning" @click="suspend">
    {{ t('action:suspend') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: suspend, canRun, isRunning } = useVmSuspendJob(() => [vm])
</script>
