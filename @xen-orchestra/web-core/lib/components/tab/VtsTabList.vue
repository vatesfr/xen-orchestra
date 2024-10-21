<!-- v2 -->
<template>
  <div class="vts-tab-list">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  { disabled: undefined }
)

defineSlots<{
  default(): any
}>()

useContext(DisabledContext, () => props.disabled)
</script>

<style lang="postcss" scoped>
.vts-tab-list {
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
