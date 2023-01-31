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
  width: 100%;
  color: var(--color-blue-scale-200);
}

:slotted(th),
:slotted(td) {
  padding: 1rem;
  border-top: 1px solid var(--color-blue-scale-400);
  border-right: 1px solid var(--color-blue-scale-400);
  text-align: left;

  &:last-child {
    border-right: none;
  }
}

:slotted(.header-row th) {
  color: var(--color-extra-blue-base);
  font-size: 1.4rem;
  font-weight: 400;
  text-transform: uppercase;
}

:slotted(.body td),
:slotted(.body th) {
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 2.4rem;
}

:slotted(.body th) {
  font-weight: 700;
}
</style>
