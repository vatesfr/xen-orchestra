<template>
  <UiTableCell>
    <div class="content">
      <VtsIcon v-if="leftIcon" :name="leftIcon" size="medium" />
      <VtsCodeSnippet v-if="codeSnippet"><slot /></VtsCodeSnippet>
      <span v-else><slot /></span>
      <VtsIcon v-if="rightIcon" v-tooltip="rightIcon.tooltip ?? false" :name="rightIcon.icon" size="medium" />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'

export type TextCellProps = {
  leftIcon?: IconName
  codeSnippet?: boolean
  rightIcon?: {
    icon: IconName
    tooltip?: string
  }
}

defineProps<TextCellProps>()
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
