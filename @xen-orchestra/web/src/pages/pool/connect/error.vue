<template>
  <div class="error-on-connection">
    <VtsStateHero image="error" type="table" no-background>
      <div class="content">
        <h1>{{ t('unable-to-connect-to', { ip }) }}</h1>
        <UiAlert accent="danger">{{ t('pool-connection-error') }}</UiAlert>
        {{ errorJson }}
        <UiButton variant="secondary" accent="brand" size="medium" @click="goBack"> {{ t('go-back') }}</UiButton>
      </div>
    </VtsStateHero>
  </div>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { ip, errorJson } = history.state

const { t } = useI18n()
const router = useRouter()

function goBack() {
  // do not allow the return to this page without argument.
  router.replace({
    name: '/pool/connect/',
  })
}
</script>

<style lang="postcss" scoped>
.error-on-connection {
  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    width: min-content;

    h1 {
      text-wrap: nowrap;
    }
  }
}
</style>
