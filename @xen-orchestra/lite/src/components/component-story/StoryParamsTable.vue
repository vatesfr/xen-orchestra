<template>
  <table class="story-params-table">
    <slot />
  </table>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.story-params-table {
  font-size: 1.4rem;
  border-spacing: 0;

  & :slotted(thead th) {
    text-align: left;
    padding: 0.3rem 0.6rem;
  }

  :slotted(tbody th.name) {
    text-align: left;
    white-space: nowrap;
  }

  & :slotted(tbody tr) {
    th,
    td {
      padding: 0.3rem 0.6rem;
      border-bottom: 0.1rem solid var(--color-blue-scale-400);
      vertical-align: center;
    }

    &:nth-child(odd) {
      background-color: var(--background-color-extra-blue);
    }
  }

  & :slotted(.help) {
    font-style: italic;
  }
}
</style>
