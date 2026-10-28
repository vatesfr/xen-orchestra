<template>
  <span class="v2v-pool-option">
    <span class="label">{{ label }}</span>
    <span v-if="counts !== undefined" class="typo-body-regular-small counts">
      <span class="part">{{ t('n-hosts', { n: counts.hosts }) }}</span>
      <span class="part">{{ t('n-srs', { n: counts.srs }) }}</span>
      <span class="part">{{ t('n-networks', { n: counts.networks }) }}</span>
    </span>
  </span>
</template>

<script lang="ts" setup>
import type { V2vPoolResourceCounts } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  label: string
  counts?: V2vPoolResourceCounts
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-pool-option {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  width: 100%;

  .label {
    flex: 1;
  }

  .counts {
    color: var(--color-neutral-txt-secondary);
  }

  .part:not(:first-child)::before {
    content: '•' / '';
    margin-inline: 0.8rem;
  }
}
</style>
