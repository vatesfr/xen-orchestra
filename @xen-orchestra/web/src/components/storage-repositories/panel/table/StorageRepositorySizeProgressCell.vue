<template>
  <div class="progress-cell">
    <VtsProgressBar :current :total label="" noruler class="progress" />
    <span>{{ n(percentage / 100, { maximumFractionDigits: 0, style: 'percent' }) }}</span>
  </div>
</template>

<script setup lang="ts">
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import { useProgress } from '@core/packages/progress/use-progress'
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
.progress-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .progress {
    flex-grow: 1;
  }
}
</style>
