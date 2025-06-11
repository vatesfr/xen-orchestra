<template>
  <div class="error-on-connection">
    <VtsStateHero image="error" type="page" no-background>
      <div class="content">
        <h1>{{ t('unable-to-connect-to', { ip }) }}</h1>
        <UiAlert accent="danger">{{ t('pool-connection-error') }}</UiAlert>
      </div>
    </VtsStateHero>
  </div>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  ip: string
  errror: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.error-on-connection {
  max-height: 80vh;

  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
  }
}
</style>
