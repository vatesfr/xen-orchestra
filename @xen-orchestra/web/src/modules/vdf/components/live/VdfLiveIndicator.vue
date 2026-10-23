<template>
  <span class="vdf-live-indicator typo-body-regular-small" role="status">
    <span class="dot" :class="{ paused }" aria-hidden="true" />
    {{ paused ? t('firewall:live:paused') : label }}
    <UiButton
      size="small"
      variant="tertiary"
      accent="brand"
      :left-icon="paused ? 'fa:play' : 'fa:pause'"
      @click="paused = !paused"
    >
      {{ paused ? t('action:resume') : t('pause') }}
    </UiButton>
  </span>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

// "Live, every 4 s", and a pause: data that keeps moving is hard to read
// (and the pulse stops when the user prefers less motion)
defineProps<{
  label: string
}>()

const paused = defineModel<boolean>('paused', { default: false })

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-neutral-txt-secondary);

  .dot {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: var(--color-success-item-base);

    &.paused {
      background-color: var(--color-neutral-txt-secondary);
    }

    @media (prefers-reduced-motion: no-preference) {
      &:not(.paused) {
        animation: pulse 2s ease-in-out infinite;
      }
    }
  }
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
