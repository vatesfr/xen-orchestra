<template>
  <span class="ui-filter">
    <slot />
    <FontAwesomeIcon :icon="faRemove" class="remove" @click="emit('remove')" />
  </span>
</template>

<script lang="ts" setup>
import { faRemove } from "@fortawesome/free-solid-svg-icons";

const emit = defineEmits<{
  (event: "remove"): void;
}>();
</script>

<style scoped>
.ui-filter {
  font-size: 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 3.4rem;
  padding: 0 1rem;
  color: var(--color-extra-blue-base);
  border: 1px solid var(--color-extra-blue-base);
  border-radius: 1.7rem;
  background-color: var(--background-color-extra-blue);
  gap: 1rem;
}

.remove {
  cursor: pointer;
  color: red;
}
</style>
