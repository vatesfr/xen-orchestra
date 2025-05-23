<!-- v1 -->
<template>
  <div class="ui-card-numbers" :class="sizeClass">
    <span class="label typo-caption-small">{{ label }}</span>
    <div class="values" :class="sizeClass">
      <span v-if="percentValue" class="value" :class="fontClass">
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

const props = defineProps<{
  label: string
  size: TSize
  value?: number
  unit?: string
  max?: number
}>()

const sizeClass = computed(() => toVariants({ size: props.size }))

const fontClass = computed(() => (props.size === 'medium' ? 'typo-h3' : 'typo-caption-small'))

const percentValue = computed(() => {
  if (props.value === undefined || props.max === undefined || props.max === 0) {
    return undefined
  }

  return props.value / props.max
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
