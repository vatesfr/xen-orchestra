<template>
  <div class="v2v-preview-label">
    <slot />
    <UiTag accent="warning" variant="secondary" class="tag">{{ t('preview') }}</UiTag>
  </div>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-preview-label {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;

  .tag {
    flex-shrink: 0;
  }
}
</style>
