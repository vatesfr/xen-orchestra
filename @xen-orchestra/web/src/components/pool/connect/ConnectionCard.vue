<template>
  <UiCard class="pool-connection-card">
    <form class="pool-connection-card" @submit.prevent="submit()">
      <div class="input-wrapper">
        <UiTitle class="primary-host-title">{{ t('master') }}</UiTitle>
        <div class="input-content" :class="{ mobile: uiStore.isMobile }">
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
      <UiTitle>{{ t('option') }}</UiTitle>
      <div class="checkbox-wrapper" :class="{ mobile: uiStore.isMobile }">
        <UiCheckbox v-model="form.readOnly" accent="brand">{{ t('read-only') }}</UiCheckbox>
        <UiCheckbox v-model="form.allowUnauthorized" accent="brand">
          {{ t('accept-self-signed-certificates') }}
        </UiCheckbox>
      </div>
      <div class="button-warper">
        <RouterLink to="/">
          <UiButton accent="brand" size="medium" variant="secondary">{{ t('cancel') }}</UiButton>
        </RouterLink>
        <UiButton type="submit" accent="brand" size="medium" variant="primary" :busy="connecting">
          {{ t('connect') }}
        </UiButton>
      </div>
    </form>
  </UiCard>
</template>

<script setup lang="ts">
import createAndConnectServer, { type ConnectServerPayload } from '@/jobs/create-server.job'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const uiStore = useUiStore()
const connecting = ref(false)

const form = reactive<ConnectServerPayload>({
  host: history?.state?.ip ?? '',
  httpProxy: '',
  username: '',
  password: '',
  readOnly: false,
  allowUnauthorized: false,
})

async function submit() {
  connecting.value = true
  try {
    const serverId = await createAndConnectServer(form)
    await router.push({
      path: '/pool/connect/success',
      state: { ip: form.host, idServer: serverId },
    })
  } catch (error: any) {
    await router.push({
      path: '/pool/connect/error',
      state: {
        ip: form.host,
        ErrorCode: error.status,
        errorJson: error.message,
      },
    })
  } finally {
    connecting.value = false
  }
}
</script>

<style lang="postcss" scoped>
.pool-connection-card {
  margin: 0.8rem;

  form {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  .input-content:not(.mobile) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.6rem 8rem;

    @media (min-width: 80rem) {
      grid-template-columns: repeat(2, minmax(0, 40rem));
    }

    .primary-host-title {
      grid-column: 1 / 3;
    }
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .checkbox-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .checkbox-wrapper:not(.mobile) {
    flex-direction: row;
    gap: 8rem;
  }

  .button-warper {
    display: flex;
    width: 100%;
    justify-content: center;
    gap: 2.4rem;
  }
}
</style>
