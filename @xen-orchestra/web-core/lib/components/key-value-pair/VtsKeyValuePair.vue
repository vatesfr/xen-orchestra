<template>
  <dt class="typo-body-regular label">
    <slot name="label">
      {{ label }}
    </slot>
  </dt>
  <dd class="typo-body-regular value">
    <span v-tooltip class="text-ellipsis">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
    <VtsCopyButton v-if="valueToCopy" :value="valueToCopy" class="copy-button" />
  </dd>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'

export type KeyValuePairProps = {
  label?: string
  value?: string
  copy?: boolean
  copyValue?: string
}

const { value, copy, copyValue } = defineProps<KeyValuePairProps>()

defineSlots<{
  label?(): any
  value?(): any
}>()

// `copyValue` alone enables the copy button, `copy` is only needed to copy `value` itself
const valueToCopy = computed(() => copyValue ?? (copy ? value : undefined))
</script>

<style lang="postcss" scoped>
.label {
  color: var(--color-neutral-txt-secondary);
}

.value {
  color: var(--color-neutral-txt-primary);
  display: flex;
  align-items: center;
  flex-grow: 1;
  gap: 0.8rem;
  min-width: 0;

  .text-ellipsis {
    &:empty::before {
      content: '-';
    }
  }

  .copy-button {
    flex-shrink: 0;
  }
}
</style>
