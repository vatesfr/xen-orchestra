<!-- v1 -->
<template>
  <div class="ui-tab-list">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'

const { disabled = undefined } = defineProps<{
  disabled?: boolean
}>()

defineSlots<{
  default(): any
}>()

useContext(DisabledContext, () => disabled)
</script>

<style lang="postcss" scoped>
.ui-tab-list {
  display: flex;
  align-items: stretch;
  height: 5rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  max-width: 100%;
  overflow: auto;
  flex-shrink: 0;
}
</style>
