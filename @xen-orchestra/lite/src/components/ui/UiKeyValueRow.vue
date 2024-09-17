<template>
  <tr class="ui-key-value-row">
    <th v-if="$slots.key" class="key typo p1-regular">
      <slot name="key" />
    </th>
    <td :colspan="$slots.key ? 1 : 2" class="value typo p1-regular">
      <slot name="value" />
    </td>
  </tr>
</template>

<style lang="postcss" scoped>
.key,
.value {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.key {
  padding-right: 2rem;
  text-align: left;
  color: var(--color-neutral-txt-secondary);

  @media (--desktop) {
    min-width: 20rem;
  }
}
</style>
