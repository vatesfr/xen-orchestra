<template>
  <span class="ui-filter">
    <span class="label" @click="emit('edit')">
      <slot />
    </span>
    <span class="remove" @click.stop="emit('remove')">
      <UiIcon :icon="faRemove" />
    </span>
  </span>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { faRemove } from "@fortawesome/free-solid-svg-icons";

const emit = defineEmits<{
  (event: "edit"): void;
  (event: "remove"): void;
}>();
</script>

<style lang="postcss" scoped>
.ui-filter {
  overflow: hidden;
  font-size: 1.6rem;
  display: inline-flex;
  align-items: stretch;
  justify-content: center;
  height: 3.4rem;
  color: var(--color-extra-blue-base);
  border-radius: 1.7rem;
  background-color: var(--background-color-extra-blue);
  gap: 1rem;
  border: 1px solid var(--color-extra-blue-base);
}

.label,
.remove {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.7;
  }
}

.label {
  padding-left: 1rem;
}

.remove {
  color: white;
  border-radius: 1.4rem;
  width: 2.8rem;
  margin: 0.2rem;
  background-color: var(--color-extra-blue-l40);

  &:hover {
    background-color: var(--color-red-vates-l20);
  }
}
</style>
