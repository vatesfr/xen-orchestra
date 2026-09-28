<template>
  <VtsStateHero format="page" type="offline" size="large" class="vm-console-offline">
    <span>{{ t('console-offline') }}</span>
    <span class="title typo-h1">{{ t('vm-not-running') }}</span>
    <div class="description typo-body-bold">
      <span>{{ t('console-unavailable-reason', { type: 'virtual machine' }) }}</span>
      <span>{{ t('start-console', { type: 'VM' }) }}</span>
    </div>
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vm-console-offline {
  padding: 0.8rem;

  .title {
    color: var(--color-neutral-txt-primary);
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
