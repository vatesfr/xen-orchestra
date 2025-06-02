<template>
  <div class="error-on-connection">
    <VtsStateHero image="error" type="table" no-background>
      <div class="content">
        <h1>{{ t('unable-to-connect-to', { ip }) }}</h1>
        <UiAlert v-if="ErrorCode == 409" accent="danger">{{ t('pool-connection-error-duplicate') }}</UiAlert>
        <!-- no error code for timeout with usefetch -->
        <UiAlert v-else-if="errorJson == 'Fetch is aborted'" accent="danger">
          {{ t('pool-connection-error-timeout') }}
        </UiAlert>
        <UiAlert v-else-if="errorJson == 'self-signed certificate' || ErrorCode == 495" accent="danger">
          {{ t('pool-connection-error-ssl') }}
        </UiAlert>
        <UiAlert v-else-if="ErrorCode == 401" accent="danger">
          {{ t('pool-connection-error-auth-failed') }}
        </UiAlert>
        <UiAlert v-else-if="ErrorCode == -69" accent="danger">
          {{ t('pool-connection-error-host-not-found') }}
        </UiAlert>
        <template v-else>
          <UiAlert accent="danger">{{ t('pool-connection-error') }}</UiAlert>
          <UiQuoteCode :label="t('api-error-details')" accent="danger" size="small" copy>
            {{ errorJson }}
            <template #actions>
              <UiButtonIcon
                v-tooltip="t('core.open-in-new-tab')"
                size="medium"
                accent="brand"
                :icon="faArrowUpRightFromSquare"
                @click="opennewtab"
              />
            </template>
          </UiQuoteCode>
        </template>
        <UiButton variant="secondary" accent="brand" size="medium" @click="goBack"> {{ t('go-back') }}</UiButton>
      </div>
    </VtsStateHero>
  </div>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiQuoteCode from '@core/components/ui/quoteCode/UiQuoteCode.vue'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { ip, errorJson, ErrorCode } = history.state
const { t } = useI18n()
const router = useRouter()

function goBack() {
  // do not allow the return to this page without argument.
  router.push({
    name: '/pool/connect/',
    state: {
      ip,
    },
  })
}

function opennewtab() {
  if (errorJson) {
    const url = `data:text/json;charset=utf-8,${encodeURIComponent(errorJson)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
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
