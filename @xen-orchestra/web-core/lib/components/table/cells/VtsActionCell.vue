<template>
  <UiTableCell align="center">
    <div class="vts-action-cell">
      <UiButtonIcon
        :icon="buttonIcon"
        :accent="buttonAccent"
        :size="buttonSize"
        :target-scale="1.5"
        @click="emit('click')"
      />
      <VtsActionsMenu v-if="actions.length" :actions />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { ButtonIconAccent, ButtonIconSize } from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'

const {
  buttonAccent = 'brand',
  buttonSize = 'small',
  actions = [],
} = defineProps<{
  buttonIcon: IconName
  buttonAccent?: ButtonIconAccent
  buttonSize?: ButtonIconSize
  actions?: ActionItem[]
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<style scoped lang="postcss">
.vts-action-cell {
  display: flex;
  gap: 0.8rem;
}
</style>
