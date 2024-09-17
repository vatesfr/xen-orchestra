<template>
  <span class="ui-badge typo p2-medium">
    <UiIcon :icon />
    <slot />
  </span>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon?: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
.ui-badge {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.8rem;
  height: 1.8em;
  color: var(--color-normal-txt-item);
  border-radius: 9.6rem;
  background-color: var(--color-neutral-txt-secondary);
}
</style>
