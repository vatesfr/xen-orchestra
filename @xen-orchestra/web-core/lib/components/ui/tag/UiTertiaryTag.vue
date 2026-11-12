<!-- v1 -->
<template>
  <span class="ui-tertiary-tag" :class="{ wrap }">
    <UiTag :accent variant="primary" class="term">
      <slot name="term" />
    </UiTag>
    <UiTag :accent variant="secondary" class="value">
      <slot />
    </UiTag>
  </span>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'

defineProps<{
  accent: TagAccent
  wrap?: boolean
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

  :deep(.term) {
    border-radius: 0.4rem 0 0 0.4rem;
  }

  :deep(.value) {
    border-radius: 0 0.4rem 0.4rem 0;
  }

  &.wrap {
    flex-wrap: wrap;
    border-radius: 0.4rem;
    overflow: hidden;

    :deep(.term),
    :deep(.value) {
      flex-grow: 1;
      justify-content: flex-start;
      border-radius: 0;
    }
  }
}
</style>
