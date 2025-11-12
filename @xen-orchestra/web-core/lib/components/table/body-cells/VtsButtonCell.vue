<template>
  <UiTableCell>
    <UiButton
      :accent="accent ?? 'brand'"
      :variant="variant ?? 'primary'"
      :size="size ?? 'medium'"
      :left-icon="icon"
      @click="handler"
    >
      {{ label }}
    </UiButton>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiButton, {
  type ButtonAccent,
  type ButtonSize,
  type ButtonVariant,
} from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'

export type ButtonCellProps = {
  label: string
  handler: () => void
  variant?: ButtonVariant
  accent?: ButtonAccent
  size?: ButtonSize
  icon?: IconName
}

defineProps<ButtonCellProps>()
</script>
