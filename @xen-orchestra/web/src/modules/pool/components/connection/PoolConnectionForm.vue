<template>
  <VtsForm class="connection-form" :class="{ mobile: uiStore.isSmall }" @submit="submit()">
    <div class="primary-host-section">
      <UiTitle>{{ t('master') }}</UiTitle>
      <div class="inputs-container">
        <PoolConnectionFormTextInput v-bind="hostInputBindings" />
        <PoolConnectionFormTextInput v-bind="httpProxyInputBindings" />
        <PoolConnectionFormTextInput v-bind="usernameInputBindings" :error="usernameError" />
        <PoolConnectionFormPasswordInput v-bind="passwordInputBindings" :error="passwordError" />
      </div>
    </div>
    <UiTitle>{{ t('options') }}</UiTitle>
    <div class="options-section">
      <UiCheckbox v-model="formData.readOnly" accent="brand">{{ t('read-only') }}</UiCheckbox>
      <UiCheckbox v-model="formData.allowUnauthorized" accent="brand">
        {{ t('accept-self-signed-certificates') }}
      </UiCheckbox>
    </div>
    <div class="buttons-container">
      <UiLink :to="{ name: '/(site)/dashboard' }" size="medium">
        {{ t('cancel') }}
      </UiLink>
      <UiButton
        type="submit"
        accent="brand"
        size="medium"
        variant="primary"
        :busy="isServerJobRunning"
        :disabled="!createCanRun"
      >
        {{ t('connect') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script setup lang="ts">
import PoolConnectionFormPasswordInput from '@/modules/pool/components/connection/inputs/PoolConnectionFormPasswordInput.vue'
import PoolConnectionFormTextInput from '@/modules/pool/components/connection/inputs/PoolConnectionFormTextInput.vue'
import { usePoolConnectionForm } from '@/modules/pool/form/use-pool-connection-form.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoServer } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  success: [serverId: XoServer['id'], ip?: string]
  error: [error: Error, ip?: string]
}>()

const { t } = useI18n()
const uiStore = useUiStore()
const serverId = ref<XoServer['id']>('' as XoServer['id'])

const {
  formData,
  validate,
  payload,
  hostInputBindings,
  httpProxyInputBindings,
  usernameInputBindings,
  passwordInputBindings,
} = usePoolConnectionForm()

const credentialsError = ref<InputWrapperMessage>()

const usernameError = computed(() => credentialsError.value ?? usernameInputBindings.value.error)
const passwordError = computed(() => credentialsError.value ?? passwordInputBindings.value.error)

// TODO: multiple server creation not possible in the UI for now
// so only handle a single payload
const { canRun: createCanRun, isRunning: createIsRunning, run: create } = useXoServerCreateJob([payload])
const { isRunning: connectIsRunning, run: connect } = useXoServerConnectJob([serverId])
const { isRunning: removeIsRunning, run: remove } = useXoServerForgetJob([serverId])

const isServerJobRunning = logicOr(connectIsRunning, createIsRunning, removeIsRunning)

async function submit() {
  credentialsError.value = undefined
  serverId.value = '' as XoServer['id']

  const valid = await validate()

  if (!valid) {
    return
  }

  try {
    // TODO: multiple server creation not possible in the UI for now
    // so only handle single server creation
    const [promiseCreateResult] = await create()
    if (promiseCreateResult.status === 'rejected') {
      throw promiseCreateResult.reason
    }
    serverId.value = promiseCreateResult.value
    const [promiseConnectResult] = await connect()
    if (promiseConnectResult.status === 'rejected') {
      throw promiseConnectResult.reason
    }

    emit('success', serverId.value, formData.host)
  } catch (error) {
    if (serverId.value !== '') {
      await remove()
    }

    if (error instanceof Error && error.message.startsWith('SESSION_AUTHENTICATION_FAILED')) {
      credentialsError.value = { content: t('invalid-username-or-password'), accent: 'danger' }
      return
    }

    if (error instanceof Error) {
      emit('error', error, formData.host)
    } else {
      console.error('Unknown error:', error)
    }
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
