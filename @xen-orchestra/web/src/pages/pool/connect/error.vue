<template>
  <ConnectPoolHeader />
  <UiCard class="pool-connection-error">
    <VtsStateHero image="error" type="card" no-background>
      <div class="container">
        <div class="typo-h1 title">
          {{ t('unable-to-connect-to', { ip }) }}
        </div>
        <div class="content" :class="{ mobile: uiStore.isMobile, desktop: !uiStore.isDesktopLarge }">
          <UiAlert v-if="errorCode == 409" accent="danger">{{ t('pool-connection-error-duplicate') }}</UiAlert>
          <!-- no error code for timeout with usefetch -->
          <UiAlert v-else-if="errorJson == 'Fetch is aborted'" accent="danger">
            {{ t('pool-connection-error-timeout') }}
          </UiAlert>
          <UiAlert v-else-if="errorJson == 'self-signed certificate' || errorCode == 495" accent="danger">
            {{ t('pool-connection-error-ssl') }}
          </UiAlert>
          <UiAlert v-else-if="errorCode == 401" accent="danger">
            {{ t('pool-connection-error-auth-failed') }}
          </UiAlert>
          <UiAlert v-else-if="errorCode == -69" accent="danger">
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
      </div>
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import ConnectPoolHeader from '@/components/pool/connect/ConnectPoolHeader.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiQuoteCode from '@core/components/ui/quoteCode/UiQuoteCode.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { ip, errorJson, errorCode } = history.state
const { t } = useI18n()
const uiStore = useUiStore()

const dataUrl = computed(() => (errorJson ? `data:text/json;charset=utf-8,${encodeURIComponent(errorJson)}` : ''))
</script>

<style lang="postcss" scoped>
.pool-connection-error {
  height: 100%;
  margin: 0.8rem;

  .container {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  .title {
    text-align: center;
  }

  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    margin: 0 auto;
    width: 65%;

    &.desktop {
      width: 80%;
    }

    &.mobile {
      width: 100%;
    }
  }
}
</style>
