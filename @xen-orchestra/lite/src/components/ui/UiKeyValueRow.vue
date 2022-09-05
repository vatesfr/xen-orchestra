<template>
  <div class="ui-key-value-row">
    <span class="key">
      <slot name="key" />
    </span>
    <span class="value">
      <slot name="value" />
    </span>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.ui-key-value-row {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  margin: 0.5em 0;
}
.key {
  color: var(--color-blue-scale-300);
  width: 15%;
}
.key,
.value {
  min-width: 15em;
  text-overflow: ellipsis;
}
</style>
