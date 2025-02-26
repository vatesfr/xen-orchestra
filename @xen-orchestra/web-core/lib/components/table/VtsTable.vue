<template>
  <table :class="{ 'vertical-border': verticalBorder }" class="vts-table typo-body-regular-small">
    <slot />
  </table>
</template>

<script lang="ts" setup>
import { provide } from 'vue'

const props = defineProps<{
  name?: string
  verticalBorder?: boolean
}>()

defineSlots<{
  default(): any
}>()

provide('tableName', props.name)
</script>

<style lang="postcss" scoped>
.vts-table {
  width: 100%;
  border-spacing: 0;
  background-color: var(--color-neutral-background-primary);
  line-height: 2.4rem;
  color: var(--color-neutral-txt-secondary);
  border-collapse: collapse;
  table-layout: fixed;

  :deep(th),
  :deep(td) {
    padding: 1rem;
    border-top: 0.1rem solid var(--color-neutral-border);
    text-align: left;
  }

  :deep(th) {
    font-weight: 700;
  }

  :deep(thead) {
    th,
    td {
      color: var(--color-brand-txt-base);
      font-size: 1.4rem;
      font-weight: 400;
      text-transform: uppercase;
    }
  }

  &.vertical-border {
    :deep(th),
    :deep(td) {
      border-right: 0.1rem solid var(--color-neutral-border);

      &:first-child {
        border-left: none;
      }

      &:last-child {
        border-right: none;
      }
    }
  }
}
</style>
