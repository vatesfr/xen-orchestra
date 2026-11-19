<!-- v1 -->
<template>
  <span class="ui-overridden">
    <VtsIcon name="fa:circle" size="current" class="icon" />
    <span class="typo-body-regular-small">
      <slot>{{ t('overridden') }}</slot>
    </span>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()
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
