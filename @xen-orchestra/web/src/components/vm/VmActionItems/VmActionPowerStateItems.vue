<template>
  <MenuItem icon="fa:play" :busy="isVmBusyToStart" :disabled="!isVmHalted" @click="start">
    {{ t('start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmStartJob } from '@/composables/vm/xo-vm-start.composable'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ vm: XoVm }>()

const { t } = useI18n()

const selectedVms = computed(() => [props.vm])

const isVmHalted = computed(() => props.vm.power_state === VM_POWER_STATE.HALTED)

const { run: runVmStart, canRun: canRunVmStart } = useVmStartJob(selectedVms)

const areOperationsPending = (operation: VM_OPERATIONS | VM_OPERATIONS[]) =>
  selectedVms.value.some(vm => isVmOperatingPending(vm, operation))

const isVmBusyToStart = computed(() => areOperationsPending(VM_OPERATIONS.START))

const start = () => {
  if (!canRunVmStart.value || !isVmHalted.value) return
  void runVmStart()
}
</script>
