<template>
  <div class="ui-tab-bar">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { IK_TAB_BAR_DISABLED } from "@/types/injection-keys";
import { computed, provide } from "vue";

const props = defineProps<{
  disabled?: boolean;
}>();

provide(
  IK_TAB_BAR_DISABLED,
  computed(() => props.disabled ?? false)
);
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
