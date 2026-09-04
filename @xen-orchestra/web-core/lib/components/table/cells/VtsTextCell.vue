<template>
  <UiTableCell>
    <div class="content">
      <VtsIcon v-tooltip="leftIcon?.tooltip ?? false" :name="leftIcon?.icon" size="medium" />
      <span><slot /></span>
      <VtsIcon v-tooltip="rightIcon?.tooltip ?? false" :name="rightIcon?.icon" size="medium" />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'

export type TextCellProps = {
  leftIcon?: {
    icon: IconName
    tooltip?: string
  }
  rightIcon?: {
    icon: IconName
    tooltip?: string
  }
}

defineProps<TextCellProps>()
</script>

<style lang="postcss" scoped>
.content {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
