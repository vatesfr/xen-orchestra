<!-- WIP -->
<template>
  <th class="ui-column-header typo-caption" scope="col">
    <slot />
  </th>
</template>

<style lang="postcss" scoped>
.ui-column-header {
  max-width: 30rem;
  padding: 0.8rem 1.2rem;
  border-block-start: 0.1rem solid var(--color-neutral-border);
  border-inline-end: 0.1rem solid var(--color-neutral-border);
  text-align: start;
  color: var(--color-brand-txt-base);
  background-color: var(--color-neutral-background-primary);

  &:last-child {
    border-inline-end: none;
  }
}
</style>
