<template>
  <table :class="{ 'vertical-border': verticalBorder, error: hasError }" class="ui-table typo p2-regular">
    <slot />
  </table>
</template>

<script lang="ts" setup>
import { provide } from 'vue'

const props = defineProps<{
  hasError?: boolean
  name?: string
  verticalBorder?: boolean
}>()

provide('tableName', props.name)
</script>

<style lang="postcss" scoped>
/* BACKGROUND COLOR VARIANTS */
.ui-table {
  --background-color: var(--background-color-primary);

  &.error {
    background-color: var(--background-color-red-10);
  }
}

/* IMPLEMENTATION */
.ui-table {
  width: 100%;
  border-spacing: 0;
  background-color: var(--background-color);
  line-height: 2.4rem;
  color: var(--color-grey-200);

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

      &:last-child {
        border-right: none;
      }
    }
  }
}
</style>
