<template>
  <div :class="{ subtitle }" class="ui-card-title">
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
.ui-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  --card-title-left-size: 2rem;
  --card-title-left-color: var(--color-blue-scale-100);
  --card-title-left-weight: 500;
  --card-title-right-size: 1.6rem;
  --card-title-right-color: var(--color-extra-blue-base);
  --card-title-right-weight: 700;

  &.subtitle {
    border-bottom: 1px solid var(--color-extra-blue-base);

    --card-title-left-size: 1.6rem;
    --card-title-left-color: var(--color-extra-blue-base);
    --card-title-left-weight: 700;
    --card-title-right-size: 1.4rem;
    --card-title-right-color: var(--color-extra-blue-base);
    --card-title-right-weight: 400;
  }
}

.left {
  font-size: var(--card-title-left-size);
  font-weight: var(--card-title-left-weight);
  color: var(--card-title-left-color);
}

.right {
  font-size: var(--card-title-right-size);
  font-weight: var(--card-title-right-weight);
  color: var(--card-title-right-color);
}
</style>
