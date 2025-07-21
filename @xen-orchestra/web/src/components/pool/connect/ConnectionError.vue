<template>
  <VtsStateHero class="connection-error" image="error" type="card" no-background>
    <div class="container">
      <div v-if="ip !== undefined" class="typo-h1 title">
        {{ t('unable-to-connect-to', { ip }) }}
      </div>
      <div class="content" :class="{ mobile: uiStore.isMobile, desktop: !uiStore.isDesktopLarge }">
        <!--        &lt;!&ndash; no error code for timeout with usefetch &ndash;&gt; -->
        <!--        <UiAlert v-else-if="errorJson == 'Fetch is aborted'" accent="danger"> -->
        <!--          {{ t('pool-connection-error-timeout') }} -->
        <!--        </UiAlert> -->
        <!--        <UiAlert v-else-if="errorCode == -69" accent="danger"> -->
        <!--          {{ t('pool-connection-error-host-not-found') }} -->
        <!--        </UiAlert> -->
        <template v-if="error instanceof ApiError">
          <UiAlert v-if="error.status === HttpCodes.Unauthorized" accent="danger">
            {{ t('pool-connection-error-auth-failed') }}
          </UiAlert>
          <UiAlert v-else-if="error.status === HttpCodes.Conflict" accent="danger">
            {{ t('pool-connection-error-duplicate') }}
          </UiAlert>
          <UiAlert v-else-if="error.status === HttpCodes.UnprocessableEntity" accent="danger">
            {{ t('pool-connection-error-duplicate') }}
          </UiAlert>
          <template v-else>
            <UiAlert accent="danger">{{ error.message }}</UiAlert>
            <UiQuoteCode :label="t('api-error-details')" accent="danger" size="small" copy>
              {{ error.cause }}
            </UiQuoteCode>
          </template>
        </template>
        <RouterLink :to="{ name: '/pool/connect' }">
          <UiButton variant="secondary" accent="brand" size="medium" @click="emit('goBack')">
            {{ t('go-back') }}
          </UiButton>
        </RouterLink>
      </div>
    </div>
  </VtsStateHero>
</template>

<script setup lang="ts">
import { ApiError } from '@/jobs/create-server.job.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuoteCode from '@core/components/ui/quoteCode/UiQuoteCode.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { useI18n } from 'vue-i18n'

const { error, ip } = defineProps<{
  ip?: string
  error: ApiError | Error
}>()

const emit = defineEmits<{
  goBack: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.connection-error {
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
