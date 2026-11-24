<template>
  <UiCard class="schedule-values-card" :class="{ error }">
    <div class="header">
      <span class="typo-body-bold">{{ title }}</span>
      <slot name="header-actions" />
    </div>

    <div class="values" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <ScheduleCronValueButton
        v-for="option of options"
        :key="option.value"
        :selected="selectedValues.includes(option.value)"
        @toggle="emit('toggle', option.value)"
      >
        {{ option.label }}
      </ScheduleCronValueButton>
    </div>

    <slot name="footer" />
  </UiCard>
</template>

<script lang="ts" setup>
import ScheduleCronValueButton from '@/modules/schedule/components/ScheduleCronValueButton.vue'
import type { ScheduleCalendarOption } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  title: string
  options: ScheduleCalendarOption[]
  columns: number
  selectedValues: number[]
  error?: boolean
}>()

const emit = defineEmits<{
  toggle: [value: number]
}>()

defineSlots<{
  'header-actions'?(): any
  footer?(): any
}>()
</script>

<style lang="postcss" scoped>
.schedule-values-card {
  gap: 0;
  padding: 0;
  overflow: hidden;

  &.error {
    border-color: var(--color-danger-item-base);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 1.6rem;
  }

  .values {
    display: grid;
    align-content: center;
    gap: 0.4rem;
    flex: 1;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-secondary);
  }
}
</style>
