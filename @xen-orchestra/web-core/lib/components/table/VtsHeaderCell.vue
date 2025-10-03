<template>
  <UiColumnHeader class="vts-header-cell">
    <div class="cell-content">
      <VtsIcon v-if="icon" :name="icon" class="icon" size="medium" />
      <span v-if="label" class="label">{{ label }}</span>
    </div>
  </UiColumnHeader>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import type { IconName } from '@core/icons'

const { icon } = defineProps<{
  label: string
  icon?: IconName
}>()
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;

  .cell-content {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    white-space: nowrap;
  }
}
</style>
