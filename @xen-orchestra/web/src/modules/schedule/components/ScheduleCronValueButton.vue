<template>
  <button
    type="button"
    class="schedule-cron-value-button typo-body-regular-small"
    :class="{ selected }"
    @click="emit('toggle')"
  >
    <slot />
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  selected: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.schedule-cron-value-button {
  padding: 0.2rem 0.4rem;
  border: 0.1rem solid transparent;
  border-radius: 0.4rem;
  background-color: transparent;
  color: var(--color-neutral-txt-secondary);
  cursor: pointer;
  text-align: center;

  &:hover {
    color: var(--color-brand-txt-base);
  }

  &.selected {
    border-color: var(--color-brand-item-base);
    background-color: var(--color-brand-background-selected);
    color: var(--color-brand-txt-base);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-brand-txt-base);
    outline-offset: 0.1rem;
  }
}
</style>
