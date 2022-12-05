<template>
  <div class="container">
    <div class="title-bar">
      <FontAwesomeIcon :icon="icon" class="icon" />
      <div class="title">
        <slot />
      </div>
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
.container {
  display: flex;
  align-items: center;
  height: 8rem;
  padding: 0 2rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
  justify-content: space-between;
}

.title-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon {
  font-size: 3.8rem;
  color: var(--color-extra-blue-base);
}

.title {
  font-size: 3rem;
  color: var(--color-blue-scale-100);
}
</style>
