<template>
  <div :class="{ subtitle }" class="ui-section-title">
    <component
      :is="subtitle ? 'h5' : 'h4'"
      v-if="$slots.default || left"
      class="left"
    >
      <slot>{{ left }}</slot>
    </component>
    <component
      :is="subtitle ? 'h6' : 'h5'"
      v-if="$slots.right || right"
      class="right"
    >
      <slot name="right">{{ right }}</slot>
    </component>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  subtitle?: boolean;
  left?: string;
  right?: string;
}>();
</script>

<style lang="postcss" scoped>
.ui-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  --section-title-left-size: 2rem;
  --section-title-left-color: var(--color-blue-scale-100);
  --section-title-left-weight: 500;
  --section-title-right-size: 1.6rem;
  --section-title-right-color: var(--color-extra-blue-base);
  --section-title-right-weight: 700;

  &.subtitle {
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
}

.right {
  font-size: var(--section-title-right-size);
  font-weight: var(--section-title-right-weight);
  color: var(--section-title-right-color);
}
</style>
