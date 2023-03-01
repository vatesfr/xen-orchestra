<template>
  <tr class="ui-key-value-row">
    <th v-if="$slots.key" class="key">
      <slot name="key" />
    </th>
    <td :colspan="$slots.key ? 1 : 2" class="value">
      <slot name="value" />
    </td>
  </tr>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
@import "@/assets/_responsive.pcss";

.key,
.value {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-weight: 400;
}

.key {
  padding-right: 2rem;
  text-align: left;
  color: var(--color-blue-scale-300);

  @media (--desktop) {
    min-width: 20rem;
  }
}
</style>
