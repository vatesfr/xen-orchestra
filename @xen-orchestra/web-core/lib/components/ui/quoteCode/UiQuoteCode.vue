<template>
  <div class="ui-quote-code">
    <slot name="title" />
    <div class="code-container">
      {{ code }}
    </div>
  </div>
</template>

<script setup lang="ts">
type quoteCodeAccent = 'brand' | 'error'

defineProps<{
  code: string
  accent: quoteCodeAccent
}>()
</script>

<style lang="postcss" scoped>
.label {
  color: var(--color-neutral-txt-primary);
  display: flex;
  justify-content: space-between;
}

.code-container {
  border-inline-start: 0.2rem solid var(--color-brand-item-base);
  background-color: var(--color-neutral-background-disabled);
  padding: 0.8rem 1.2rem;
  border-radius: 0.4rem;
}
</style>
