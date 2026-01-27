<template>
  <MenuItem v-if="canRun || isRunning" :disabled="!canSuspend" icon="fa:moon" :busy="isRunning" @click="suspend">
    {{ t('action:suspend') }}
    <span v-if="!canSuspend">{{ t('vm-tools-missing') }}</span>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: suspend, canRun, isRunning } = useXoVmSuspendJob(() => [vm])
const { guestToolsDisplay } = useXoVmUtils(() => vm)

const canSuspend = computed(() => guestToolsDisplay.value.type !== 'link')
</script>
