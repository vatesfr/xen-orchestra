<template>
  <MenuItem icon="fa:play" :busy="isVmBusyToStart" :disabled="!isVmHalted || !canRunVmStart" @click="start">
    {{ t('start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmStartJob } from '@/jobs/vm-start.job'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ vm: XoVm }>()

const { t } = useI18n()

const isVmHalted = computed(() => props.vm.power_state === VM_POWER_STATE.HALTED)

const selectedVms = computed(() => [props.vm])

const { run: runVmStart, canRun: canRunVmStart, isRunning: isVmStartRunning } = useVmStartJob(selectedVms)

const isVmBusyToStart = computed(() => isVmStartRunning.value)

const start = () => {
  if (!canRunVmStart.value || !isVmHalted.value) return
  void runVmStart()
}
</script>
