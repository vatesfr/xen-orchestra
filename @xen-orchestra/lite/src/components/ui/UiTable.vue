<template>
  <table class="ui-table">
    <thead>
      <tr class="header-row">
        <slot name="header" />
      </tr>
    </thead>
    <tbody class="body">
      <slot />
    </tbody>
  </table>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.ui-table {
  border-spacing: 0;
}

:deep(th),
:deep(td) {
  padding: 1rem;
  border-top: 1px solid lightgrey;
  border-right: 1px solid lightgrey;
  text-align: left;

  &:last-child {
    border-right: none;
  }
}

:deep(.header-row th) {
  color: var(--color-extra-blue-base);
  font-size: 1.4rem;
  font-weight: 400;
  text-transform: uppercase;
}

:deep(.body td) {
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 2.4rem;
}
</style>
