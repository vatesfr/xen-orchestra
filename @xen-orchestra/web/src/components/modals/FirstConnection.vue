<template>
  <VtsModal accent="info" icon="fa:satellite">
    <template #title>{{ $t('welcome-to-xo6') }}</template>
    <template #content>
      <div class="pop-up-content">
        <p>
          {{ $t('popup-first-connection-introduction') }}<br />
          <I18nT keypath="popup-first-connection-default-interface">
            <template #documentationLink>
              <UiLink
                href="https://docs.xen-orchestra.com/configuration#using-xo-5-as-the-default-interface"
                size="medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t('popup-first-connection-follow-this-guide') }}
              </UiLink>
            </template>
          </I18nT>
        </p>
        <p>
          {{ $t('popup-first-connection-early-release') }}
        </p>
        <p>
          <I18nT keypath="popup-first-connection-feedback" scope="global" tag="p">
            <template #feedbackLink>
              <UiLink
                href="https://xcp-ng.org/forum/topic/11604/xo-6-dedicated-thread-for-all-your-feedback"
                size="medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t('popup-first-connection-feedback-and-impressions') }}
              </UiLink>
            </template>
          </I18nT>
        </p>
        <p>
          {{ $t('popup-first-connection-upcoming-release') }}
        </p>
        <p class="xo-team">
          {{ $t('the-xo-team') }}
        </p>
      </div>
    </template>
    <template #buttons>
      <VtsModalConfirmButton>{{ $t('lets-go') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
</script>

<style lang="postcss" scoped>
.pop-up-content {
  text-align: justify;

  .xo-team {
    font-style: italic;
    font-weight: bold;
  }

  p {
    margin-bottom: 1.5rem;
  }
}
</style>
