<template>
  <UiCard class="v2v-remembered-connections-card">
    <UiCardTitle>
      {{ t('remembered-connections') }}
      <template #description>{{ t('stored-in-browser-only') }}</template>
    </UiCardTitle>
    <slot />
    <p class="typo-body-regular-small hint">{{ t('v2v:credentials-never-stored') }}</p>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-remembered-connections-card {
  .hint {
    margin: 0;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
