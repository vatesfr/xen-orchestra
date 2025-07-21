<template>
  <form class="connection-form" :class="{ mobile: uiStore.isMobile }" @submit.prevent="submit()">
    <div class="primary-host-section">
      <UiTitle>{{ t('master') }}</UiTitle>
      <div class="inputs-container">
        <VtsInputWrapper :label="t('ip-address')">
          <!-- TODO validation -->
          <UiInput v-model="form.host" accent="brand" required :placeholder="t('ip-port-placeholder')" />
          <UiInfo accent="info" wrap>
            {{ t('pool-connection-ip-info') }}
          </UiInfo>
        </VtsInputWrapper>
        <!-- TODO validation -->
        <VtsInputWrapper :label="t('proxy-url')">
          <UiInput v-model="form.httpProxy" accent="brand" />
        </VtsInputWrapper>
        <!-- TODO validation -->
        <VtsInputWrapper :label="t('username')">
          <UiInput v-model="form.username" accent="brand" required />
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
      <RouterLink to="/">
        <UiButton accent="brand" size="medium" variant="secondary">{{ t('cancel') }}</UiButton>
      </RouterLink>
      <UiButton type="submit" accent="brand" size="medium" variant="primary" :busy="connecting">
        {{ t('connect') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import createAndConnectServer, { type NewServer, ApiError } from '@/jobs/create-server.job'
import type { XoServer } from '@/types/xo/server.type.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  success: [serverId: XoServer['id'], ip?: string]
  error: [error: ApiError, ip?: string]
}>()

const { t } = useI18n()
const uiStore = useUiStore()
const connecting = ref(false)
const serverId = ref<XoServer['id']>()

const form = reactive<NewServer>({
  host: '',
  httpProxy: '',
  username: '',
  password: '',
  readOnly: false,
  allowUnauthorized: false,
})

async function submit() {
  connecting.value = true
  try {
    serverId.value = await createAndConnectServer(form)
    emit('success', serverId.value, form.host)
  } catch (error: ApiError | any) {
    if (error instanceof ApiError) {
      emit('error', error, form.host)
    } else {
      console.error('Unknown error:', error)
    }
  } finally {
    connecting.value = false
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
