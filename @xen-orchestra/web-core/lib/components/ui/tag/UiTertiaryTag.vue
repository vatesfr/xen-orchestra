<!-- v1 -->
<template>
  <span class="ui-tertiary-tag">
    <UiTag :accent variant="primary" class="radius-left">
      <slot name="term" />
    </UiTag>
    <UiTag :accent variant="secondary" class="radius-right">
      <slot />
    </UiTag>
  </span>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'

defineProps<{
  accent: TagAccent
}>()

defineSlots<{
  default(): any
  term(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-tertiary-tag {
  display: inline-flex;
  flex-direction: row;

  :deep(.radius-left) {
    border-radius: 0.4rem 0 0 0.4rem;
  }

  :deep(.radius-right) {
    border-radius: 0 0.4rem 0.4rem 0;
  }
}
</style>
