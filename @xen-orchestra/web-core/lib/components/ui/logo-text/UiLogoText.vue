<template>
  <div class="ui-logo-text">{{ text }}</div>
</template>

<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<style lang="postcss" scoped>
.ui-logo-text {
  font-family: 'Poppins Vates', sans-serif;
  font-size: 2.4rem;
  color: var(--color-neutral-txt-primary);
  text-transform: uppercase;
}
</style>
