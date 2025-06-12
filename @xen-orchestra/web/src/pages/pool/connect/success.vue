<template>
  <VtsStateHero image="all-done" type="table" no-background>
    <h1>{{ t('unable-to-connect-to', { ip }) }}</h1>
    <UiAlert accent="success">
      {{ t('pool-connection-success') }}
    </UiAlert>
    <UiLink :to="{ name: '/pool/[id]', params: { id: idServer } }" size="medium" />
    <UiButton variant="secondary" accent="brand" size="medium" :left-icon="faPlus" @click="connectAnotherPool()">
      {{ t('Connect-another-pool') }}
    </UiButton>
  </VtsStateHero>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const { ip, idServer } = history.state

function connectAnotherPool() {
  // do not allow the return to this page without argument.
  router.replace({
    path: '/pool/connect/',
  })
}
</script>
