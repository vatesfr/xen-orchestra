<template>
  <VtsModal accent="info" icon="fa:satellite">
    <template #title>
      {{ t('welcome-to-xo6') }}
    </template>
    <template #content>
      <div class="popup-content">
        <div>
          {{ t('popup-first-connection-introduction') }}
          <I18nT keypath="popup-first-connection-default-interface">
            <template #documentationLink>
              <UiLink
                href="https://docs.xen-orchestra.com/configuration#using-xo-5-as-the-default-interface"
                size="medium"
              >
                {{ t('popup-first-connection-follow-this-guide') }}
              </UiLink>
            </template>
          </I18nT>
        </div>
        <div>{{ t('popup-first-connection-early-release') }}</div>
        <I18nT keypath="popup-first-connection-feedback" scope="global" tag="div">
          <template #feedbackLink>
            <UiLink
              href="https://xcp-ng.org/forum/topic/11604/xo-6-dedicated-thread-for-all-your-feedback"
              size="medium"
            >
              {{ t('popup-first-connection-feedback-and-impressions') }}
            </UiLink>
          </template>
        </I18nT>
        <div>{{ t('popup-first-connection-upcoming-release') }}</div>
        <div class="xo-team">
          {{ t('xo-team') }}
        </div>
      </div>
    </template>
    <template #buttons>
      <VtsModalConfirmButton>{{ t('lets-go') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.popup-content {
  text-align: justify;
  div {
    margin-bottom: 1.5rem;
  }
  .xo-team {
    font-style: italic;
    font-weight: bold;
  }
}
</style>
