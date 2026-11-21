<!-- v1 -->
<template>
  <span class="ui-overridden">
    <VtsIcon name="fa:circle" size="current" class="icon" />
    <span v-if="slots.default" class="typo-body-regular-small">
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'

const slots = defineSlots<{
  default?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-overridden {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  height: 2.4rem;
  color: var(--color-info-txt-base);
  white-space: nowrap;

  .icon {
    font-size: 0.8rem;
  }
}
</style>
