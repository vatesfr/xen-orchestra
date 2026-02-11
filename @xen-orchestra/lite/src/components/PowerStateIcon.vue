<template>
  <VtsIcon :name="icon" size="medium" class="power-state-icon" />
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { computed } from 'vue'

const props = defineProps<{
  state: VM_POWER_STATE
}>()

const icons: Record<VM_POWER_STATE, IconName> = {
  [VM_POWER_STATE.RUNNING]: 'status:running-circle',
  [VM_POWER_STATE.PAUSED]: 'status:paused-circle',
  [VM_POWER_STATE.SUSPENDED]: 'status:suspended-circle',
  [VM_POWER_STATE.HALTED]: 'status:halted-circle',
}

const icon = computed(() => icons[props.state])
</script>
