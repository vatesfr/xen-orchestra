<template>
  <table :class="{ 'vertical-border': verticalBorder, error: color === 'error' }" class="ui-table">
    <slot />
  </table>
</template>

<script lang="ts" setup>
defineProps<{
  color?: 'error'
  verticalBorder?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-table {
  width: 100%;
  border-spacing: 0;
  background-color: var(--background-color-primary);
  font-weight: 400;
  font-size: 1.4rem;
  line-height: 2.4rem;
  color: var(--color-grey-200);

  :deep(th),
  :deep(td) {
    padding: 1rem;
    border-top: 1px solid var(--color-grey-500);
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
      border-right: 1px solid var(--color-grey-500);

      &:last-child {
        border-right: none;
      }
    }
  }
}

.error {
  background-color: var(--background-color-red-10);
}
</style>
