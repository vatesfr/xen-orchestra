<template>
  <div class="v2v-list-lock-summary">
    <div class="rows">
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
    </div>
    <p class="note typo-body-regular-small">{{ t('v2v:list-lock-info') }}</p>
  </div>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  sourceHost?: string
  poolName?: string
  isLocked: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-list-lock-summary {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .rows {
    padding: 0.8rem 1.2rem;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    background-color: var(--color-neutral-background-secondary);
  }

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
