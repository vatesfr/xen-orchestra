<template>
  <div class="ui-dropdown-list">
    <slot name="before" />
    <div class="container">
      <slot />
    </div>
    <slot name="after" />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
  before?(): any
  after?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-dropdown-list {
  display: flex;
  flex-direction: column;
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;

  .container {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
}
</style>
