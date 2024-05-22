<!-- v1.0 -->
<template>
  <div class="legend-title typo c3-semi-bold">
    {{ title }}
    <UiIcon :icon color="info" />
  </div>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'

defineProps<{
  title: string
  icon?: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
.legend-title {
  color: var(--color-grey-200);
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.ui-icon {
  font-size: 1.6rem;
}
</style>
