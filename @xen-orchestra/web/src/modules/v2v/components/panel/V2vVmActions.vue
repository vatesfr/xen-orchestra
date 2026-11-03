<template>
  <UiButton
    v-if="mainAction"
    v-tooltip="mainAction.hint ?? false"
    size="medium"
    variant="primary"
    accent="brand"
    :disabled="mainAction.disabled"
    :left-icon="mainAction.icon"
    :busy="mainAction.busy"
    @click="mainAction.onClick()"
  >
    {{ mainAction.label }}
  </UiButton>
  <VtsActionsMenu size="medium" :actions="moreActions" />
</template>

<script lang="ts" setup>
import type { V2vVmActionList } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

// A VM gone from the source has no main action, only the ones of the menu
defineProps<V2vVmActionList>()
</script>
