<template>
  <div class="v2v-list-lock-summary">
    <VtsCardRowKeyValue>
      <template #key>{{ t('source') }}</template>
      <template #value>{{ sourceHost }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('destination') }}</template>
      <template #value>{{ poolName }}</template>
    </VtsCardRowKeyValue>
    <p class="note typo-body-regular-small">{{ t('v2v:list-lock-info') }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { V2vListLock } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import { useI18n } from 'vue-i18n'

defineProps<V2vListLock>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-list-lock-summary {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .note {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
