<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :icon="action.icon"
    :busy="action.busy"
    :disabled="action.disabled"
    @click="action.run()"
  >
    {{ action.label }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { VmPowerStateActionDefinition } from '@/modules/vm/composables/vm-power-state-actions.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'

defineProps<{
  action: VmPowerStateActionDefinition
}>()
</script>
