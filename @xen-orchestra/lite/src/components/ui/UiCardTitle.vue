<template>
  <div class="ui-section-title" :class="tags.left">
    <component :is="tags.left" v-if="slots.default || left" class="left">
      <slot>{{ left }}</slot>
      <UiCounter v-if="count > 0" class="count" :value="count" accent="info" variant="primary" size="small" />
    </component>
    <component :is="tags.right" v-if="slots.right || right" class="right">
      <slot name="right">{{ right }}</slot>
    </component>
  </div>
</template>

<script lang="ts" setup>
import { UiCardTitleLevel } from '@/types/enums'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    count?: number
    level?: UiCardTitleLevel
    left?: string
    right?: string
  }>(),
  { count: 0, level: UiCardTitleLevel.Title }
)

const slots = defineSlots<{
  default?(): any
  right?(): any
}>()

const tags = computed(() => {
  switch (props.level) {
    case UiCardTitleLevel.Subtitle:
      return { left: 'h6', right: 'h6' }
    case UiCardTitleLevel.SubtitleWithUnderline:
      return { left: 'h5', right: 'h6' }
    default:
      return { left: 'h4', right: 'h5' }
  }
})
</script>

<style lang="postcss" scoped>
.ui-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  --section-title-left-size: 2rem;
  --section-title-left-color: var(--color-neutral-txt-primary);
  --section-title-left-weight: 500;
  --section-title-right-size: 1.6rem;
  --section-title-right-color: var(--color-brand-txt-base);
  --section-title-right-weight: 700;

  &.h6 {
    margin-bottom: 1rem;
    --section-title-left-size: 1.5rem;
    --section-title-left-color: var(--color-neutral-txt-secondary);
    --section-title-left-weight: 400;
  }

  &.h5 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-brand-txt-base);
    --section-title-left-size: 1.6rem;
    --section-title-left-color: var(--color-brand-txt-base);
    --section-title-left-weight: 700;
    --section-title-right-size: 1.4rem;
    --section-title-right-color: var(--color-brand-txt-base);
    --section-title-right-weight: 400;
  }
}

.left {
  font-size: var(--section-title-left-size);
  font-weight: var(--section-title-left-weight);
  color: var(--section-title-left-color);
  display: flex;
  align-items: center;
  gap: 2rem;
}

.right {
  font-size: var(--section-title-right-size);
  font-weight: var(--section-title-right-weight);
  color: var(--section-title-right-color);
}

.count {
  font-size: 1.6rem;
}
</style>
