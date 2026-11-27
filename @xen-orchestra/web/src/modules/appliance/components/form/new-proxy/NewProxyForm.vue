<template>
  <div class="new-proxy-form">
    <UiTitle>{{ t('configuration') }}</UiTitle>
    <div class="row address">
      <FormTextInput v-bind="hostInputBindings" />
      <FormTextInput v-bind="portInputBindings" />
    </div>
    <div class="row">
      <FormTextInput v-bind="usernameInputBindings" />
      <FormPasswordInput v-bind="passwordInputBindings" />
    </div>
    <UiButton
      :busy="isTestingConnection"
      accent="brand"
      class="test-button"
      size="medium"
      variant="secondary"
      @click="testConnection()"
    >
      {{ t('action:test-connection') }}
    </UiButton>
    <UiAlert v-if="connectionTest?.status === 'success'" accent="success">
      <span class="typo-body-bold">{{ t('appliance:proxy-test-success') }}</span>
      <template #description>
        <I18nT keypath="appliance:proxy-test-success-description" scope="global">
          <template #address>
            <code>{{ connectionTest.address }}</code>
          </template>
        </I18nT>
      </template>
    </UiAlert>
    <UiAlert v-else-if="connectionTest?.status === 'failure'" accent="danger">
      <span class="typo-body-bold">{{ t('appliance:proxy-test-failure') }}</span>
      <template #description>
        <I18nT keypath="appliance:proxy-test-failure-description" scope="global">
          <template #address>
            <code>{{ connectionTest.address }}</code>
          </template>
        </I18nT>
      </template>
    </UiAlert>
  </div>
</template>

<script lang="ts" setup>
import { useProxyForm } from '@/modules/appliance/form/proxy/use-proxy-form.ts'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { I18nT, useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  connectionTest,
  isTestingConnection,
  testConnection,
  hostInputBindings,
  portInputBindings,
  usernameInputBindings,
  passwordInputBindings,
  validateAndBuildPayload,
} = useProxyForm()

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.new-proxy-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .row {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      min-width: 0;
    }

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  .address {
    @media (--medium-or-large) {
      grid-template-columns: 3fr 1fr;
    }
  }

  .test-button {
    align-self: flex-start;
  }
}
</style>
