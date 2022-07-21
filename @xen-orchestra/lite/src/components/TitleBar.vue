<template>
  <div class="title-bar">
    <FontAwesomeIcon :icon="icon" class="icon" />
    <div class="title">
      <slot />
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

defineProps<{
  icon: IconDefinition;
}>();
</script>

<style lang="postcss" scoped>
.title-bar {
  display: flex;
  align-items: center;
  height: 8rem;
  padding: 0 2rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
  gap: 1.5rem;
}

.icon {
  font-size: 4.8rem;
  color: var(--color-extra-blue-base);
}

.title {
  font-size: 3.6rem;
  color: var(--color-blue-scale-100);
}
</style>
