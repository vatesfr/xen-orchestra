<template>
  <div class="app-login form-container">
    <form @submit.prevent="handleSubmit">
      <img alt="XO Lite" src="../assets/logo-title.svg" />
      <FormInputWrapper>
        <FormInput v-model="login" name="login" readonly type="text" />
      </FormInputWrapper>
      <FormInput
        name="password"
        ref="passwordRef"
        type="password"
        v-model="password"
        :class="{ error: isInvalidPassword }"
        :placeholder="$t('password')"
        :readonly="isConnecting"
        required
      />
      <LoginError :error="error" />
      <label class="remember-me-label">
        <FormCheckbox v-model="rememberMe" />
        <p>{{ $t("keep-me-logged") }}</p>
      </label>
      <UiButton type="submit" :busy="isConnecting">
        {{ $t("login") }}
      </UiButton>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { usePageTitleStore } from "@/stores/page-title.store";
import { storeToRefs } from "pinia";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useLocalStorage } from "@vueuse/core";

import FormCheckbox from "@/components/form/FormCheckbox.vue";
import FormInput from "@/components/form/FormInput.vue";
import FormInputWrapper from "@/components/form/FormInputWrapper.vue";
import LoginError from "@/components/LoginError.vue";
import UiButton from "@/components/ui/UiButton.vue";
import type { XenApiError } from "@/libs/xen-api/xen-api.types";
import { useXenApiStore } from "@/stores/xen-api.store";

const { t } = useI18n();
usePageTitleStore().setTitle(t("login"));
const xenApiStore = useXenApiStore();
const { isConnecting } = storeToRefs(xenApiStore);
const login = ref("root");
const password = ref("");
const error = ref<XenApiError>();
const passwordRef = ref<InstanceType<typeof FormInput>>();
const isInvalidPassword = ref(false);
const rememberMe = useLocalStorage("rememberMe", false);

const focusPasswordInput = () => passwordRef.value?.focus();

onMounted(() => {
  if (rememberMe.value) {
    xenApiStore.reconnect();
  } else {
    focusPasswordInput();
  }
});

watch(password, () => {
  isInvalidPassword.value = false;
  error.value = undefined;
});

async function handleSubmit() {
  try {
    await xenApiStore.connect(login.value, password.value);
  } catch (err: any) {
    if (err.message === "SESSION_AUTHENTICATION_FAILED") {
      focusPasswordInput();
      isInvalidPassword.value = true;
    } else {
      console.error(error);
    }

    error.value = err;
  }
}
</script>

<style lang="postcss" scoped>
.remember-me-label {
  cursor: pointer;
  width: fit-content;
  & .form-checkbox {
    margin: 1rem 1rem 1rem 0;
    vertical-align: middle;
  }
  & p {
    display: inline;
    vertical-align: middle;
  }
}

.form-container {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  min-height: 100vh;
  max-width: 100vw;
  background-color: var(--background-color-primary);
}

form {
  display: flex;
  font-size: 2rem;
  min-width: 30em;
  max-width: 100%;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  padding: 8.5rem;
  background-color: var(--background-color-secondary);
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
  border: 1px solid var(--color-blue-scale-400);
  border-radius: 0.8rem;
  background-color: white;
}

button {
  margin: 2rem auto;
}
</style>
