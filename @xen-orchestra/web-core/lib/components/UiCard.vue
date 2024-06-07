<template>
  <div class="ui-card" :style="{ flexDirection: direction }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
type Props = {
  direction: 'column' | 'row'
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.ui-card {
  display: flex;
  gap: 2.4rem;
  padding: 2.4rem;
  width: 100%;
  height: 100%;
  box-shadow: var(--shadow-200);
  background-color: var(--background-color-primary);
  border: 0.1rem solid var(--color-grey-500);
  border-radius: 0.8rem;
}
</style>
