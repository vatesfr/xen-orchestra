<template>
  <UiCard class="vdf-stat-card" :class="`accent--${accent}`">
    <div class="head">
      <span class="icon"><VtsIcon :name="icon" size="medium" /></span>
      <span class="typo-caption label">{{ label }}</span>
    </div>
    <div class="value">
      <span class="typo-h2">{{ value }}</span>
      <span v-if="total !== undefined" class="typo-h5 total">{{ t('firewall:of-total', { total }) }}</span>
    </div>
    <div v-if="caption || slots.default" class="typo-body-regular-small caption">
      <slot>{{ caption }}</slot>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  icon: IconName
  label: string
  value: number | string
  total?: number
  caption?: string
  accent: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
}>()

const slots = defineSlots<{
  default?(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-stat-card {
  gap: 0.8rem;

  .head {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    color: var(--vdf-accent-item);
    background-color: var(--vdf-accent-background);
  }

  .label {
    color: var(--color-neutral-txt-secondary);
    text-transform: uppercase;
  }

  .value {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    color: var(--color-neutral-txt-primary);
  }

  .total,
  .caption {
    color: var(--color-neutral-txt-secondary);
  }

  &.accent--brand {
    --vdf-accent-item: var(--color-brand-item-base);
    --vdf-accent-background: var(--color-brand-background-selected);
  }

  &.accent--success {
    --vdf-accent-item: var(--color-success-item-base);
    --vdf-accent-background: var(--color-success-background-selected);
  }

  &.accent--warning {
    --vdf-accent-item: var(--color-warning-item-base);
    --vdf-accent-background: var(--color-warning-background-selected);
  }

  &.accent--danger {
    --vdf-accent-item: var(--color-danger-item-base);
    --vdf-accent-background: var(--color-danger-background-selected);
  }

  &.accent--neutral {
    --vdf-accent-item: var(--color-neutral-txt-secondary);
    --vdf-accent-background: var(--color-neutral-background-secondary);
  }
}
</style>
