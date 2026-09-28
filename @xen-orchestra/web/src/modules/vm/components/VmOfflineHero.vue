<template>
  <VtsStateHero class="vm-offline-hero" format="page" type="offline" size="large" horizontal>
    <span>{{ t('all-quiet-launchpad') }}</span>
    <span class="title typo-h1">{{ t('vm-shutdown') }}</span>
    <div class="description typo-body-bold">
      <span>{{ t('vm-off') }}</span>
      <span>
        <slot>{{ t('start-vm') }}</slot>
      </span>
    </div>
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  /** what to do with the VM started, `start-vm` by default */
  default?(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vm-offline-hero {
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
