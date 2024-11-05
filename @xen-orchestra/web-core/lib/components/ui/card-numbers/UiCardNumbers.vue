<!-- v1 -->
<template>
  <div class="ui-card-numbers" :class="sizeClass">
    <span class="label" :class="labelFontClass">{{ label }}</span>
    <div class="values" :class="sizeClass">
      <span v-if="percentValue" class="value typo c2-semi-bold">
        {{ percentValue }}
      </span>

      <div class="value" :class="valueFontClass">
        {{ value ?? '-' }}<span class="unit" :class="unitFontClass">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TSize extends 'small' | 'medium'">
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface CardNumbersProps {
  label: string
  size: TSize
  value?: number
  unit?: string
  max?: TSize extends 'small' ? number : never
}

const props = defineProps<CardNumbersProps>()

const { n } = useI18n()

const sizeClass = computed(() => toVariants({ size: props.size }))

const labelFontClass = computed(() => (props.size === 'medium' ? 'typo c3-semi-bold' : 'typo c2-semi-bold'))

const valueFontClass = computed(() => (props.size === 'medium' ? 'typo h3-semi-bold' : 'typo c2-semi-bold'))

const unitFontClass = computed(() => (props.size === 'medium' ? 'typo p2-medium' : 'typo c2-semi-bold'))

const percentValue = computed(() => {
  if (props.size !== 'small' || props.max === undefined || props.max === 0) {
    return undefined
  }

  if (props.value === undefined) {
    return n(0, 'percent').replace('0', '-')
  }

  return n(props.value / props.max, 'percent')
})
</script>

<style lang="postcss" scoped>
.ui-card-numbers {
  display: flex;
  width: fit-content;

  .values {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .value {
    color: var(--color-neutral-txt-primary);
    display: flex;
    gap: 0.2rem;
    align-items: center;
  }

  .unit {
    color: var(--color-neutral-txt-primary);
  }

  /* SIZE VARIANTS */

  &.size--small {
    gap: 0.8rem;
    flex-direction: row;

    .label {
      color: var(--color-neutral-txt-primary);
    }

    .values {
      align-items: flex-end;
    }
  }

  &.size--medium {
    gap: 0.4rem;
    flex-direction: column;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .values {
      align-items: flex-start;
    }
  }
}
</style>
