<template>
  <MenuItem icon="fa:play" :busy="isBusy" :disabled="!canStart" @click="start">
    {{ t('start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmStartJob } from '@/jobs/vm/vm-start.job'
import { isVmOperatingPending } from '@/utils/xo-records/vm.util'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: start, canRun, isRunning } = useVmStartJob([vm])

const isVmHalted = computed(() => vm.power_state === VM_POWER_STATE.HALTED)

const isBusy = computed(() => isRunning.value || isVmOperatingPending(vm, VM_OPERATIONS.START))

const canStart = computed(() => isVmHalted.value && canRun.value && !isBusy.value)
</script>
