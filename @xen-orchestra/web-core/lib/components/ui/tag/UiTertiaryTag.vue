<!-- v1 -->
<template>
  <span :class="{ truncate }" class="ui-tertiary-tag">
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
  truncate?: boolean
}>()

defineSlots<{
  default(): any
  term(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-tertiary-tag {
  display: inline-grid;
  grid-template-columns: auto auto;

  :deep(.radius-left) {
    border-radius: 0.4rem 0 0 0.4rem;
  }

  :deep(.radius-right) {
    border-radius: 0 0.4rem 0.4rem 0;
  }

  &.truncate :deep(.ui-tag) {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
