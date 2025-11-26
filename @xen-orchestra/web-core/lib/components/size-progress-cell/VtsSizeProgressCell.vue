<template>
  <UiTableCell>
    <div class="vts-progress-bar-cell">
      <VtsProgressBar :current :total noruler class="progress" />
      <span>{{ n(percentage / 100, { maximumFractionDigits: 0, style: 'percent' }) }}</span>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useProgress } from '@core/packages/progress/use-progress.ts'
import { useI18n } from 'vue-i18n'

const { current, total } = defineProps<{
  current: number
  total: number
}>()

const { n } = useI18n()

const { percentage } = useProgress(
  () => current,
  () => total
)
</script>

<style lang="postcss" scoped>
.vts-progress-bar-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .progress {
    flex-grow: 1;
  }
}
</style>
