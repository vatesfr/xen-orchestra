<template>
  <UiTableCell class="vts-button-icons-cell" align="center">
    <div class="buttons">
      <UiButtonIcon
        v-for="(button, index) of buttons"
        :key="index"
        v-tooltip="button.label"
        :aria-label="button.label"
        :icon="button.icon"
        :disabled="button.disabled"
        :target-scale="1.5"
        accent="brand"
        size="small"
        @click="button.onClick()"
      />
    </div>
  </UiTableCell>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'

export type ButtonIconItem = {
  icon: IconName
  label: string
  onClick: () => void
  disabled?: boolean
}

defineProps<{
  buttons: ButtonIconItem[]
}>()
</script>

<style lang="postcss" scoped>
.vts-button-icons-cell {
  width: 8rem;
  padding: 0.8rem 1.6rem 0.8rem 0.8rem;

  .buttons {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
  }
}
</style>
