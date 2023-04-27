<template>
  <table :class="{ 'vertical-border': verticalBorder }" class="ui-table">
    <slot />
  </table>
</template>

<script lang="ts" setup>
defineProps<{
  verticalBorder?: boolean;
}>();
</script>

<style lang="postcss" scoped>
.ui-table {
  width: 100%;
  border-spacing: 0;
  background-color: var(--background-color-primary);
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 2.4rem;
  color: var(--color-blue-scale-200);

  :deep(th),
  :deep(td) {
    padding: 1rem;
    border-top: 1px solid var(--color-blue-scale-400);
    text-align: left;
  }

  :deep(th) {
    font-weight: 700;
  }

  :deep(thead) {
    th,
    td {
      color: var(--color-extra-blue-base);
      font-size: 1.4rem;
      font-weight: 400;
      text-transform: uppercase;
    }
  }

  &.vertical-border {
    :deep(th),
    :deep(td) {
      border-right: 1px solid var(--color-blue-scale-400);

      &:last-child {
        border-right: none;
      }
    }
  }
}
</style>
