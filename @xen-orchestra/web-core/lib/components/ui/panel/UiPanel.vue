<!-- v2 -->
<template>
  <div class="ui-panel" :class="{ error, 'mobile-drawer': uiStore.isMobile }">
    <div v-if="slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@core/stores/ui.store'

defineProps<{
  error?: boolean
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
}>()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.ui-panel {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  border-inline-start: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

  &:not(.mobile-drawer) {
    height: calc(100dvh - 16rem);
  }

  .header {
    border-bottom: 0.1rem solid var(--color-neutral-border);
    background-color: var(--color-neutral-background-primary);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.6rem;
    padding: 0.4rem 1.6rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 0.8rem;
    gap: 0.8rem;
  }

  &.mobile-drawer {
    .content {
      overflow: auto;
    }
  }

  &.error {
    background-color: var(--color-danger-background-selected);

    .content {
      padding-top: 15rem;
    }
  }
}
</style>
