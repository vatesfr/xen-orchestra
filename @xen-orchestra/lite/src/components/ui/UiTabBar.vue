<template>
  <div class="ui-tab-bar">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { usePropagatedProp } from "@/composables/propagated-prop.composable";
import { IK_PROPAGATED_DISABLED } from "@/types/injection-keys";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  { disabled: undefined }
);

usePropagatedProp(IK_PROPAGATED_DISABLED, () => props.disabled);
</script>

<style lang="postcss" scoped>
.ui-tab-bar {
  display: flex;
  align-items: stretch;
  height: 6.5rem;
  border-bottom: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
  max-width: 100%;
  overflow: auto;
}
</style>
