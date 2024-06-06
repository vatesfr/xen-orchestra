<template>
  <table class="story-params-table typo p2-regular">
    <slot />
  </table>
</template>

<style lang="postcss" scoped>
.story-params-table {
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
      border-bottom: 0.1rem solid var(--color-grey-500);
      vertical-align: center;
    }

    &:nth-child(odd) {
      background-color: var(--background-color-purple-10);
    }
  }

  & :slotted(.help) {
    font-style: italic;
  }
}
</style>
