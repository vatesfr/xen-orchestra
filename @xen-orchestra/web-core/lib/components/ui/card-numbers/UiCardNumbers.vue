<!-- v1 -->
<template>
  <div class="ui-card-numbers" :class="sizeClass">
    <span class="label typo-caption-small">{{ label }}</span>
    <div class="values" :class="sizeClass">
      <span v-if="percentValue !== undefined" class="value" :class="fontClass">
        <I18nN tag="span" :value="percentValue" :class="fontClass" format="percent" />
      </span>

      <div class="value" :class="fontClass">
        {{ value ?? '-' }}<span class="unit" :class="fontClass">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TSize extends 'small' | 'medium'">
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'
import { I18nN } from 'vue-i18n'

const { label, size, value, unit, max } = defineProps<{
  label: string
  size: TSize
  value?: number
  unit?: string
  max?: number
}>()

const sizeClass = computed(() => toVariants({ size }))

const fontClass = computed(() => (size === 'medium' ? 'typo-h3' : 'typo-caption-small'))

const percentValue = computed(() => {
  if (value === undefined || max === undefined || max === 0) {
    return undefined
  }

  return value / max
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
