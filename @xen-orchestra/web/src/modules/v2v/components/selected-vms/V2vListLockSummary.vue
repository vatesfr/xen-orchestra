<template>
  <div class="v2v-list-lock-summary">
    <VtsCardRowKeyValue>
      <template #key>{{ t('source') }}</template>
      <template #value>{{ sourceHost }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('destination') }}</template>
      <template #value>
        <span class="destination">
          <VtsIcon v-if="isLocked" v-tooltip="t('locked')" name="fa:lock" size="medium" />
          {{ poolName }}
        </span>
      </template>
    </VtsCardRowKeyValue>
    <p class="note typo-body-regular-small">{{ t('v2v:list-lock-info') }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { V2vListLock } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<V2vListLock>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-list-lock-summary {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .destination {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  .note {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
