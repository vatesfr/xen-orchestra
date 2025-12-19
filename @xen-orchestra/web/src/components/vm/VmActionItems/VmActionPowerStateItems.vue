<template>
  <MenuItem icon="fa:play" :busy="isVmBusyToStart" :disabled="isVmStartDisabled" @click="start">
    {{ t('start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useJobVmStart } from '@/composables/vm/xo-vm-start.composable'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()

const { t } = useI18n()

const { run: runVmStart, canRun: canRunVmStart, isRunning: isVmStartRunning } = useJobVmStart(computed(() => [vm]))

const isVmHalted = computed(() => vm.power_state === VM_POWER_STATE.HALTED)

const isVmBusyToStart = isVmStartRunning
const isVmStartDisabled = computed(() => !isVmHalted.value || !canRunVmStart.value)

const start = () => {
  if (isVmStartDisabled.value) return
  void runVmStart()
}
</script>
