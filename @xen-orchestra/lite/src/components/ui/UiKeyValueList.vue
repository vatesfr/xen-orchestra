<template>
  <div class="ui-key-value-list"><slot /></div>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.ui-key-value-list {
  margin-top: 2rem;
  font-size: 1.4rem;
  /* UiKeyValueRow: 15em (key) + 15em (value) + 1rem (gap) */
  min-width: calc(30em + 1rem);
}
</style>
