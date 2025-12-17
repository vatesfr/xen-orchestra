<template>
  <MenuItem icon="fa:play" :disabled="isVmRunning" @click="handleStart">{{ t('start') }}</MenuItem>
</template>

<script lang="ts" setup>
import { vmActions } from '@/actions/vm-actions'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()

const { t } = useI18n()

const isVmRunning = computed(() => vm.power_state === VM_POWER_STATE.RUNNING)

const handleStart = async () => {
  await vmActions.start(vm.id)
}
</script>
