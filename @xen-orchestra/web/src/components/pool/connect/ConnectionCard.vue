<template>
  <UiCard class="pool-connection-card">
    <form class="pool-connection-card" @submit.prevent="submit()">
      <div class="input-wrapper">
        <UiTitle class="primary-host-title">{{ t('master') }}</UiTitle>
        <div class="input-content">
          <VtsInputWrapper :label="t('ip-address')">
            <!-- TODO validation -->
            <UiInput v-model="form.host" accent="brand" required :placeholder="t('ip-port-place-holder')" />
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
      <div class="checkbox-wrapper">
        <UiCheckbox v-model="form.readOnly" accent="brand">{{ t('read-only') }}</UiCheckbox>
        <UiCheckbox v-model="form.allowUnauthorized" accent="brand">
          {{ t('accept-self-signed-certificates') }}
        </UiCheckbox>
      </div>
      <div class="button-warper">
        <UiButton accent="brand" size="medium" variant="secondary" @click="cancel()">{{ t('cancel') }}</UiButton>
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
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const connecting = ref(false)

const form: ConnectServerPayload = reactive({
  host: history?.state?.ip ?? '',
  httpProxy: '',
  username: '',
  password: '',
  readOnly: false,
  allowUnauthorized: false,
})

function submit() {
  // Clone the form to avoid reactivity issues
  const payload = { ...form }
  connecting.value = true
  createAndConnectServer(payload)
    .then(response => {
      if (response) {
        router.push({
          path: '/pool/connect/success',
          state: {
            ip: form.host,
            idServer: response,
          },
        })
      } else {
        router.push({
          path: '/pool/connect/error',
          state: {
            ip: form.host,
            errorJson: response,
          },
        })
      }
    })
    .catch(reson => {
      router.push({
        path: '/pool/connect/error',
        state: {
          ip: form.host,
          ErrorCode: reson.status,
          errorJson: reson.message,
        },
      })
    })
    .finally(() => (connecting.value = false))
}

function cancel() {
  router.push('/')
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

  .input-content {
    display: grid;
    grid-template-columns: 40rem 40rem;
    gap: 1.6rem 8rem;

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
