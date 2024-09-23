<template>
  <div class="title-bar">
    <UiIcon :icon class="icon" />
    <div class="title typo h4-medium">
      <slot />
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
.actions {
  margin-left: auto;
}

.title-bar {
  display: flex;
  align-items: center;
  height: 6rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  gap: 0.8rem;
}

.icon {
  font-size: 2.5rem;
  color: var(--color-normal-txt-base);
}

.title {
  color: var(--color-neutral-txt-primary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
