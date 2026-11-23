<!-- v1 -->
<template>
  <span class="ui-tertiary-tag" :class="className">
    <UiTag :accent variant="primary" class="term">
      <slot name="term" />
    </UiTag>
    <UiTag :accent :removable class="value" variant="secondary" @remove="emit('remove')">
      <slot />
    </UiTag>
  </span>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { truncate, wrap } = defineProps<{
  accent: TagAccent
  truncate?: boolean
  wrap?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

defineSlots<{
  default(): any
  term(): any
}>()

const className = computed(() => toVariants({ truncate, wrap }))
</script>

<style lang="postcss" scoped>
.ui-tertiary-tag {
  display: inline-grid;
  grid-template-columns: auto auto;

  :deep(.term) {
    border-radius: 0.4rem 0 0 0.4rem;
  }

  :deep(.value) {
    border-radius: 0 0.4rem 0.4rem 0;
  }

  &.truncate :deep(.ui-tag) {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.wrap {
    display: inline-flex;
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
