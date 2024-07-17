<template>
  <table :class="{ 'vertical-border': verticalBorder }" class="ui-table typo p2-regular">
    <slot />
  </table>
</template>

<script lang="ts" setup>
import { provide } from 'vue'

const props = defineProps<{
  name?: string
  verticalBorder?: boolean
}>()

provide('tableName', props.name)
</script>

<style lang="postcss" scoped>
.ui-table {
  width: 100%;
  border-spacing: 0;
  background-color: var(--background-color-primary);
  line-height: 2.4rem;
  color: var(--color-grey-200);
  border-collapse: collapse;
  table-layout: fixed;

  :deep(th),
  :deep(td) {
    padding: 1rem;
    border-top: 0.1rem solid var(--color-grey-500);
    text-align: left;
  }

  :deep(th) {
    font-weight: 700;
  }

  :deep(thead) {
    th,
    td {
      color: var(--color-purple-base);
      font-size: 1.4rem;
      font-weight: 400;
      text-transform: uppercase;
    }
  }

  &.vertical-border {
    :deep(th),
    :deep(td) {
      border-right: 0.1rem solid var(--color-grey-500);

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
