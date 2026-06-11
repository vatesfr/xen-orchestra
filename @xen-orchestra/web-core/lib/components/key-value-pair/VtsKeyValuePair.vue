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
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'

const { label, value, copy, copyValue } = defineProps<{
  label?: string
  value?: string
  copy?: boolean
  copyValue?: string
}>()

defineSlots<{
  label?(): any
  value?(): any
}>()

const valueToCopy = computed(() => (copy || copyValue !== undefined ? (copyValue ?? value) : undefined))
</script>

<style lang="postcss" scoped>
.label {
  color: var(--color-neutral-txt-secondary);
}

.value {
  color: var(--color-neutral-txt-primary);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;

  .text-ellipsis {
    &:empty::before {
      content: '-';
    }
  }
}
</style>
