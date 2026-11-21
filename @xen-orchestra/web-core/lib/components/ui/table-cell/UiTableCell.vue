<!-- WIP -->
<template>
  <td class="ui-table-cell typo-body-regular" :class="[align, { flexible, capped }]">
    <slot />
  </td>
</template>

<script lang="ts" setup>
export type TableCellAlign = 'start' | 'center' | 'end'

const { align = 'start' } = defineProps<{
  align?: TableCellAlign
  flexible?: boolean
  capped?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-table-cell {
  padding: 1.2rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-inline-start: none;
  color: var(--color-neutral-txt-primary);
  background-color: var(--ui-table-cell-background-color, var(--color-neutral-background-primary));
  max-width: 50rem;

  &:last-child {
    border-inline-end: none;
  }

  &.start {
    text-align: start;
  }

  &.center {
    text-align: center;
  }

  &.end {
    text-align: end;
  }

  &.flexible {
    width: 60rem;
    max-width: none;
    min-width: 20rem;

    > :slotted(*) {
      width: 0;
      min-width: 100%;
    }
  }

  &.capped {
    max-width: 20rem;
  }
}
</style>
