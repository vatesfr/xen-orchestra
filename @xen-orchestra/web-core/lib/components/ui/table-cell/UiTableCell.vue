<template>
  <td class="ui-table-cell typo-body-regular" :class="className">
    <slot />
  </td>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type TableCellAlign = 'left' | 'center' | 'right'

const { align } = defineProps<{
  align?: TableCellAlign
}>()

const className = computed(() => toVariants({ align }))
</script>

<style lang="postcss" scoped>
.ui-table-cell {
  padding: 1.2rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-left: none;
  text-align: left;
  color: var(--color-neutral-txt-primary);
  background-color: var(--ui-table-cell-background-color, var(--color-neutral-background-primary));
  max-width: 20rem;

  &:last-child {
    border-right: none;
  }

  &.align--center {
    text-align: center;
  }

  &.align--right {
    text-align: right;
  }
}
</style>
