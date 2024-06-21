<template>
  <div class="ui-card" :class="{ horizontal }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
type Props = {
  horizontal?: boolean
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.ui-card {
  display: flex;
  gap: 2.4rem;
  padding: 2.4rem;
  flex-direction: column;
  background-color: var(--background-color-primary);
  border: 0.1rem solid var(--color-grey-500);
  border-radius: 0.8rem;
}

.horizontal {
  flex-direction: row;
}
</style>
