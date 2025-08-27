<template>
  <VtsStateHero class="connection-error" type="error" format="card" no-background>
    <div class="container">
      <div class="typo-h1 title">
        {{ ip !== undefined ? t('unable-to-connect-to', { ip }) : t('unable-to-connect-to-the-pool') }}
      </div>
      <div class="content" :class="{ mobile: uiStore.isMobile, desktop: !uiStore.isDesktopLarge }">
        <UiAlert accent="danger">
          {{ errorDetails.text }}
        </UiAlert>
        <UiLogEntryViewer
          v-if="error instanceof ApiError && errorDetails.showCause"
          :label="t('api-error-details')"
          accent="danger"
          size="small"
          :content="error.cause"
        />
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
import { ApiError } from '@/error/api.error.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useMapper } from '@core/packages/mapper'
import { useUiStore } from '@core/stores/ui.store.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { computed } from 'vue'
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

const errorStatus = computed(() => (error instanceof ApiError ? error.status : HttpCodes.InternalServerError))

const mapping = new Map([
  [
    HttpCodes.Unauthorized,
    {
      text: t('pool-connection-error-auth-failed'),
      showCause: false,
    },
  ],
  [
    HttpCodes.NotFound,
    {
      text: t('pool-connection-error-host-not-found'),
      showCause: false,
    },
  ],
  [
    HttpCodes.Conflict,
    {
      text: t('pool-connection-error-duplicate'),
      showCause: false,
    },
  ],
  [
    HttpCodes.UnprocessableEntity,
    {
      text: t('pool-connection-error-invalid-parameters'),
      showCause: true,
    },
  ],
  [
    HttpCodes.InternalServerError,
    {
      text: error.message,
      showCause: true,
    },
  ],
])

const errorDetails = useMapper(() => errorStatus.value, mapping, HttpCodes.InternalServerError)
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
