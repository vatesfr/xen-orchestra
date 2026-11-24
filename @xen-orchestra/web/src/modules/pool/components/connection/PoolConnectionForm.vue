<template>
  <VtsForm class="connection-form" :class="{ mobile: uiStore.isSmall }" @submit="onSubmit()">
    <div class="primary-host-section">
      <UiTitle>{{ t('master') }}</UiTitle>
      <div class="inputs-container">
        <FormTextInput v-bind="hostInputBindings" />
        <FormTextInput v-bind="httpProxyInputBindings" />
        <FormTextInput v-bind="usernameInputBindings" />
        <FormPasswordInput v-bind="passwordInputBindings" />
      </div>
    </div>
    <UiTitle>{{ t('options') }}</UiTitle>
    <div class="options-section">
      <FormCheckbox v-bind="readOnlyCheckboxBindings" />
      <FormCheckbox v-bind="allowUnauthorizedCheckboxBindings" />
    </div>
    <div class="buttons-container">
      <UiLink :to="{ name: '/(site)/dashboard' }" size="medium">
        {{ t('cancel') }}
      </UiLink>
      <UiButton type="submit" accent="brand" size="medium" variant="primary" :busy="isServerJobRunning">
        {{ t('connect') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script setup lang="ts">
import { usePoolConnectionForm } from '@/modules/pool/form/use-pool-connection-form.ts'
import { isAuthenticationFailedError } from '@/modules/pool/utils/xo-pool.util.ts'
import { useServerCreateAndConnect } from '@/modules/server/composables/use-server-create-and-connect.composable.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoServer } from '@vates/types'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  success: [serverId: XoServer['id'], ip?: string]
  error: [error: Error, ip?: string]
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const {
  formData,
  validate,
  payload,
  showCredentialsError,
  hostInputBindings,
  httpProxyInputBindings,
  usernameInputBindings,
  passwordInputBindings,
  readOnlyCheckboxBindings,
  allowUnauthorizedCheckboxBindings,
} = usePoolConnectionForm()

const { createAndConnectServer, isRunning: isServerJobRunning } = useServerCreateAndConnect(payload)

async function onSubmit() {
  const valid = await validate()

  if (!valid) {
    return
  }

  try {
    const serverId = await createAndConnectServer()

    emit('success', serverId, formData.host)
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error('Unknown error:', error)
      return
    }

    if (isAuthenticationFailedError(error)) {
      showCredentialsError()
      return
    }

    emit('error', error, formData.host)
  }
}
</script>

<style lang="postcss" scoped>
.connection-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .inputs-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 40rem));
    gap: 1.6rem 8rem;
  }

  .primary-host-section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .options-section {
    display: flex;
    flex-direction: row;
    gap: 8rem;
  }

  .buttons-container {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    gap: 2.4rem;
  }

  &.mobile {
    .inputs-container {
      grid-template-columns: 1fr;
    }

    .options-section {
      flex-direction: column;
      gap: 2.4rem;
    }
  }
}
</style>
