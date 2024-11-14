<!-- v1.0 -->
<template>
  <div class="tab-list">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable'

const props = defineProps<{
  disabled?: boolean
}>()

useDisabled(() => props.disabled)
</script>

<style lang="postcss" scoped>
.tab-list {
  display: flex;
  align-items: stretch;
  height: 5rem;
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  max-width: 100%;
  overflow: auto;
  flex-shrink: 0;
}
</style>
