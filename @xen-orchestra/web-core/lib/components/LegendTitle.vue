<template>
  <!-- Legend title v1.0.1 -->
  <span v-if="title" class="legend-title typo c3-semi-bold"
    >{{ title }} <UiIcon :icon="hasIcon !== false ? faFaceSmile : undefined" color="info" class="ui-icon"
  /></span>
</template>
<script setup lang="ts">
import { faFaceSmile } from '@fortawesome/free-solid-svg-icons'
import UiIcon from '@core/components/icon/UiIcon.vue'
defineProps({
  title: String,
  hasIcon: {
    type: Boolean,
    default: false,
  },
})
</script>
<style lang="postcss" scoped>
.legend-title {
  color: var(--color-grey-200);
  display: flex;
  gap: 0.8rem;
  align-items: center;

  & .ui-icon {
    font-size: 1.2rem;
  }
}
</style>
