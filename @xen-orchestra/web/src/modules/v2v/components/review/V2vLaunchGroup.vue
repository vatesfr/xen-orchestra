<template>
  <UiCard v-if="count > 0">
    <UiCardTitle>
      {{ heading.label }}
      <UiCounter :value="count" :accent="heading.accent" size="medium" variant="primary" />
    </UiCardTitle>
    <slot />
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter, { type CounterAccent } from '@core/components/ui/counter/UiCounter.vue'

defineProps<{
  heading: V2vAccentedLabel<CounterAccent>
  count: number
}>()

defineSlots<{
  default(): any
}>()
</script>
