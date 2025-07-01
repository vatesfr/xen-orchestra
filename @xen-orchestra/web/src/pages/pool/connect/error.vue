<template>
  <div class="pool-connection-error">
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
              <a
                v-if="errorJson"
                v-tooltip="t('core.open-in-new-tab')"
                :href="dataUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UiButtonIcon size="medium" accent="brand" :icon="faArrowUpRightFromSquare" />
              </a>
            </template>
          </UiQuoteCode>
        </template>
        <RouterLink :to="{ name: '/pool/connect/', state: { ip } }">
          <UiButton variant="secondary" accent="brand" size="medium">
            {{ t('go-back') }}
          </UiButton>
        </RouterLink>
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { ip, errorJson, ErrorCode } = history.state
const { t } = useI18n()

const dataUrl = computed(() => (errorJson ? `data:text/json;charset=utf-8,${encodeURIComponent(errorJson)}` : ''))
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
