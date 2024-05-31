<template>
  <div class="ui-card" :style="{ flexDirection: direction, padding: padding ? '2.4rem' : 0 }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
type Props = {
  direction: 'column' | 'row'
  padding: boolean
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.ui-card {
  display: flex;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-200);
  background-color: var(--background-color-primary);
  border: 1px solid var(--color-grey-500);
  gap: 2.4rem;
  width: 100%;
  height: 100%;
}
</style>
