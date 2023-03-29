<template>
  <div
    :class="[
      'ui-section-title',
      level === UI_CARD_TITLE_LEVEL.SUBTITLE ? 'subtitle' : '',
      level === UI_CARD_TITLE_LEVEL.SUBTITLE_WITH_UNDERLINE
        ? 'subtitle-with-underline'
        : '',
    ]"
  >
    <component
      :is="
        level === UI_CARD_TITLE_LEVEL.TITLE
          ? 'h4'
          : UI_CARD_TITLE_LEVEL.SUBTITLE_WITH_UNDERLINE
          ? 'h5'
          : 'h6'
      "
      v-if="$slots.default || left"
      class="left"
    >
      <slot>{{ left }}</slot>
      <UiCounter class="count" v-if="count > 0" :value="count" color="info" />
    </component>
    <component
      :is="level === UI_CARD_TITLE_LEVEL.TITLE ? 'h5' : 'h6'"
      v-if="$slots.right || right"
      class="right"
    >
      <slot name="right">{{ right }}</slot>
    </component>
  </div>
</template>

<script lang="ts" setup>
import UiCounter from "@/components/ui/UiCounter.vue";
import { UI_CARD_TITLE_LEVEL } from "@/components/enums";


withDefaults(
  defineProps<{
    subtitle?: boolean;
    left?: string;
    right?: string;
    count?: number;
  }>(),
  { count: 0 }

withDefaults(
  defineProps<{
    level?: UI_CARD_TITLE_LEVEL;
    left?: string;
    right?: string;
  }>(),
  { level: UI_CARD_TITLE_LEVEL.TITLE }
);
</script>

<style lang="postcss" scoped>
.ui-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  --section-title-left-size: 2rem;
  --section-title-left-color: var(--color-blue-scale-100);
  --section-title-left-weight: 500;
  --section-title-right-size: 1.6rem;
  --section-title-right-color: var(--color-extra-blue-base);
  --section-title-right-weight: 700;

  &.subtitle {
    margin-bottom: 1rem;
    --section-title-left-size: 1.5rem;
    --section-title-left-color: var(--color-blue-scale-300);
    --section-title-left-weight: 400;
  }

  &.subtitle-with-underline {
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-extra-blue-base);
    --section-title-left-size: 1.6rem;
    --section-title-left-color: var(--color-extra-blue-base);
    --section-title-left-weight: 700;
    --section-title-right-size: 1.4rem;
    --section-title-right-color: var(--color-extra-blue-base);
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
