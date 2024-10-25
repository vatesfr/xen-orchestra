<template>
  <div class="ui-table-actions">
    <UiActionsTitle>
      <slot />
    </UiActionsTitle>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'

defineSlots<{
  actions(): any
  default(): any
}>()
</script>

<style scoped lang="postcss">
.ui-table-actions {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  padding-block: 0.4rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
}
</style>
