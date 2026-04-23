<template>
  <div class="app-login">
    <div class="card" :class="className">
      <div class="title">
        <img alt="XO Lite" src="@/assets/xo-lite-badge.svg" />
        <span class="welcome-text">
          {{ t('welcome-to-xo-lite') }}
        </span>
        <span v-if="!isHostIsSlaveErr(error)">
          {{ t('please-sign-in-info') }}
        </span>
      </div>

      <PoolOverrideWarning />

      <UiInfo v-if="isHostIsSlaveErr(error)" accent="danger">
        {{ t('login-only-on-master') }}
        <a :href="masterUrl.href">{{ masterUrl.hostname }}</a>
      </UiInfo>

      <form v-else @submit.prevent="handleSubmit">
        <VtsInputWrapper>
          <template #label>
            <span class="form-label">
              {{ t('login') }}
            </span>
          </template>
          <FormInput v-model="login" name="login" readonly type="text" />
        </VtsInputWrapper>

        <VtsInputWrapper>
          <template #label>
            <span class="form-label">
              {{ t('password') }}
            </span>
          </template>
          <FormInput
            ref="passwordRef"
            v-model="password"
            name="password"
            type="password"
            :class="{ error: isInvalidPassword }"
            :placeholder="t('password')"
            :readonly="xenApiStore.isConnecting"
            required
          />
          <UiInfo v-if="error" accent="danger">
            {{ error.message === 'SESSION_AUTHENTICATION_FAILED' ? t('password-invalid') : t('error-occurred') }}
          </UiInfo>
        </VtsInputWrapper>

        <UiCheckbox v-model="rememberMe" accent="brand">
          {{ t('keep-me-logged') }}
        </UiCheckbox>

        <span class="login-button">
          <UiButton size="medium" accent="brand" variant="primary" type="submit" :busy="xenApiStore.isConnecting">
            {{ t('login') }}
          </UiButton>
        </span>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import PoolOverrideWarning from '@/components/PoolOverrideWarning.vue'
import type { XenApiError } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useUiStore } from '@core/stores/ui.store'
import { toVariants } from '@core/utils/to-variants.util'
import { useLocalStorage, whenever } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const uiStore = useUiStore()
const xenApiStore = useXenApiStore()
const rememberMe = useLocalStorage('rememberMe', false)

const password = ref('')
const login = ref('root')
const error = ref<XenApiError>()
const isInvalidPassword = ref(false)
const masterUrl = ref(new URL(window.origin))
const passwordRef = ref<InstanceType<typeof FormInput>>()

usePageTitleStore().setTitle(t('login'))
const focusPasswordInput = () => passwordRef.value?.focus()
const isHostIsSlaveErr = (err: XenApiError | undefined) => err?.message === 'HOST_IS_SLAVE'

const isLargeVariant = computed(() => uiStore.isMedium || uiStore.isMediumOrLarge)
const className = computed(() =>
  toVariants({
    'size-s': !isLargeVariant.value,
    'size-m': isLargeVariant.value,
  })
)

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
  () => {
    const newHostname = error.value?.data
    if (newHostname) {
      masterUrl.value.hostname = newHostname
    }
  }
)

async function handleSubmit() {
  try {
    await xenApiStore.connect(login.value, password.value)
  } catch (err: any) {
    if (err.message === 'SESSION_AUTHENTICATION_FAILED') {
      focusPasswordInput()
      isInvalidPassword.value = true
    } else {
      console.error(err)
    }

    error.value = err
  }
}
</script>

<style lang="postcss" scoped>
.app-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  max-width: 100vw;

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rem;
    background-color: var(--color-neutral-background-secondary);
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.8rem;

    .title {
      display: flex;
      flex-direction: column;
      align-items: center;

      .welcome-text {
        font-family: 'Poppins Vates', sans-serif;
        font-size: 3.6rem;
        color: var(--color-neutral-txt-primary);
        font-weight: 600;
        text-transform: uppercase;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.6rem;

      .form-label {
        text-transform: uppercase;
      }

      .login-button {
        margin: 0 auto;
      }
    }

    &.size-m {
      padding: 10rem 8rem;

      img {
        width: 40rem;
        height: 30rem;
      }
    }

    &.size-s {
      padding: 4rem 1.2rem;
      border: none;
      width: 100%;
      height: 100vh;

      img {
        width: 25rem;
        height: 18.3rem;
      }
    }
  }
}
</style>
