<template>
  <div class="app-login form-container">
    <div class="card">
      <img alt="XO Lite" src="../assets/logo-title.svg" />
      <PoolOverrideWarning />
      <p v-if="isHostIsSlaveErr(error)" class="error">
        <UiIcon :icon="faExclamationCircle" />
        {{ t('login-only-on-master') }}
        <a :href="masterUrl.href">{{ masterUrl.hostname }}</a>
      </p>
      <form v-else class="form" @submit.prevent="handleSubmit">
        <VtsInputWrapper :label="t('login')">
          <FormInput v-model="login" name="login" readonly type="text" />
        </VtsInputWrapper>

        <VtsInputWrapper :label="$t('password')">
          <FormInput
            ref="passwordRef"
            v-model="password"
            name="password"
            type="password"
            :class="{ error: isInvalidPassword }"
            :placeholder="t('password')"
            :readonly="isConnecting"
            required
          />
        </VtsInputWrapper>
        <LoginError :error />

        <UiCheckbox v-model="rememberMe" accent="brand">
          {{ t('keep-me-logged') }}
        </UiCheckbox>
        <UiButton size="medium" accent="brand" variant="primary" type="submit" :busy="isConnecting">
          {{ t('login') }}
        </UiButton>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import LoginError from '@/components/LoginError.vue'
import PoolOverrideWarning from '@/components/PoolOverrideWarning.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { XenApiError } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { useLocalStorage, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
usePageTitleStore().setTitle(t('login'))
const xenApiStore = useXenApiStore()
const { isConnecting } = storeToRefs(xenApiStore)
const login = ref('root')
const password = ref('')
const error = ref<XenApiError>()
const passwordRef = ref<InstanceType<typeof FormInput>>()
const isInvalidPassword = ref(false)
const masterUrl = ref(new URL(window.origin))
const rememberMe = useLocalStorage('rememberMe', false)

const focusPasswordInput = () => passwordRef.value?.focus()
const isHostIsSlaveErr = (err: XenApiError | undefined) => err?.message === 'HOST_IS_SLAVE'

onMounted(() => {
  if (rememberMe.value) {
    xenApiStore.reconnect()
  } else {
    focusPasswordInput()
  }
})

watch(password, () => {
  isInvalidPassword.value = false
  error.value = undefined
})

whenever(
  () => isHostIsSlaveErr(error.value),
  () => (masterUrl.value.hostname = error.value!.data)
)

async function handleSubmit() {
  try {
    await xenApiStore.connect(login.value, password.value)
  } catch (err: any) {
    if (err.message === 'SESSION_AUTHENTICATION_FAILED') {
      focusPasswordInput()
      isInvalidPassword.value = true
    } else {
      console.error(error)
    }

    error.value = err
  }
}
</script>

<style lang="postcss" scoped>
.form-container {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  min-height: 100vh;
  max-width: 100vw;
  background-color: var(--color-neutral-background-primary);
}

.card {
  display: flex;
  font-size: 2rem;
  min-width: 30em;
  max-width: 100%;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  padding: 8.5rem;
  background-color: var(--color-neutral-background-secondary);

  .error {
    color: var(--color-danger-txt-base);
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

h1 {
  font-size: 4.8rem;
  font-weight: 900;
  line-height: 7.2rem;
  margin-bottom: 4.2rem;
}

img {
  width: 40rem;
  margin: auto auto 5rem auto;
}

input {
  width: 45rem;
  max-width: 100%;
  margin-bottom: 1rem;
  padding: 1rem 1.5rem;
  border: 1px solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: white;
}

button {
  margin: 2rem auto;
}
</style>
