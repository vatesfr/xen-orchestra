<template>
  <form class="connection-form" :class="{ mobile: uiStore.isMobile }" @submit.prevent="submit()">
    <div class="primary-host-section">
      <UiTitle>{{ t('master') }}</UiTitle>
      <div class="inputs-container">
        <VtsInputWrapper :label="t('ip-address')">
          <!-- TODO validation -->
          <UiInput v-model.trim="form.host" accent="brand" required :placeholder="t('ip-port-placeholder')" />
          <UiInfo accent="info" wrap>
            {{ t('pool-connection-ip-info') }}
          </UiInfo>
        </VtsInputWrapper>
        <!-- TODO validation -->
        <VtsInputWrapper :label="t('proxy-url')">
          <UiInput v-model.trim="form.httpProxy" accent="brand" />
        </VtsInputWrapper>
        <!-- TODO validation -->
        <VtsInputWrapper :label="t('username')">
          <UiInput v-model.trim="form.username" accent="brand" required />
          <UiInfo accent="info" wrap>
            {{ t('root-by-default') }}
          </UiInfo>
        </VtsInputWrapper>
        <!-- TODO validation -->
        <VtsInputWrapper :label="t('password')">
          <UiInput v-model="form.password" accent="brand" required type="password" />
        </VtsInputWrapper>
      </div>
    </div>
    <UiTitle>{{ t('options') }}</UiTitle>
    <div class="options-section">
      <UiCheckbox v-model="form.readOnly" accent="brand">{{ t('read-only') }}</UiCheckbox>
      <UiCheckbox v-model="form.allowUnauthorized" accent="brand">
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
  </form>
</template>

<script setup lang="ts">
import { useServerConnectJob } from '@/jobs/server/server-connect.job'
import { useServerCreateJob } from '@/jobs/server/server-create.job'
import { useServerRemoveJob } from '@/jobs/server/server-remove.job'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store'
import type { XoServer } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  success: [serverId: XoServer['id'], ip?: string]
  error: [error: Error, ip?: string]
}>()

const { t } = useI18n()
const uiStore = useUiStore()
const serverId = ref<XoServer['id']>('' as XoServer['id'])

interface NewServerForm {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly: boolean
  allowUnauthorized: boolean
}

const form = reactive<NewServerForm>({
  host: '',
  httpProxy: '',
  username: '',
  password: '',
  readOnly: false,
  allowUnauthorized: false,
})

const payload = computed(() => ({
  host: form.host,
  username: form.username,
  password: form.password,
  ...Object.assign(
    {},
    form.httpProxy && { httpProxy: form.httpProxy },
    form.readOnly && { readOnly: form.readOnly },
    form.allowUnauthorized && { allowUnauthorized: form.allowUnauthorized }
  ),
}))

// TODO: multiple server creation not possible in the UI for now
// so only handle a single payload
const { canRun: createCanRun, isRunning: createIsRunning, run: create } = useServerCreateJob([payload])
const { isRunning: connectIsRunning, run: connect } = useServerConnectJob([serverId])
const { isRunning: removeIsRunning, run: remove } = useServerRemoveJob([serverId])

const isServerJobRunning = logicOr(connectIsRunning, createIsRunning, removeIsRunning)

async function submit() {
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

    emit('success', serverId.value, form.host)
  } catch (error) {
    await remove()
    if (error instanceof Error) {
      emit('error', error, form.host)
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
