<!-- v1 -->
<template>
  <div class="ui-data-ruler typo-body-regular-small">
    <span>{{ n(0, 'percent') }}</span>
    <span v-for="(step, index) in steps" :key="step">
      <VtsIcon v-if="index === 1 && step > 1" v-tooltip="message ?? undefined" :icon="faExclamationCircle" :accent />
      {{ n(step, 'percent') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon, { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { steps = [0.5, 1], accent = 'current' } = defineProps<{
  steps?: [number, number]
  accent?: IconAccent
  message?: string
}>()

const { n } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-data-ruler {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-neutral-txt-secondary);
}
</style>
