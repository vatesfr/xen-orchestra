<template>
  <div class="appliance-version-block" :class="className">
    <span class="label typo-caption-small">{{ label }}</span>
    <span class="version typo-h3">{{ version }}</span>
    <span v-if="detail !== undefined" class="detail typo-body-regular-small">{{ detail }}</span>
  </div>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { variant } = defineProps<{
  label: string
  version: string
  detail?: string
  variant: 'neutral' | 'highlighted' | 'unknown'
}>()

const className = computed(() => toVariants({ variant }))
</script>

<style lang="postcss" scoped>
.appliance-version-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.6rem 2.4rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;

  .label {
    color: var(--color-neutral-txt-secondary);
  }

  .detail {
    color: var(--color-neutral-txt-secondary);
  }

  &.variant--highlighted {
    border-color: var(--color-brand-txt-base);
    background-color: var(--color-brand-background-selected);

    .label {
      color: var(--color-brand-txt-base);
    }
  }

  &.variant--unknown {
    border-style: dashed;
    border-color: var(--color-neutral-txt-secondary);

    .version {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
