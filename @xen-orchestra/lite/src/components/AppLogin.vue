<template>
  <div class="app-login form-container">
    <form @submit.prevent="handleSubmit">
      <img alt="XO Lite" src="../assets/logo-title.svg" />
      <FormInputWrapper>
        <FormInput v-model="login" name="login" readonly type="text" />
      </FormInputWrapper>
      <FormInputWrapper :error="error">
        <FormInput
          name="password"
          ref="passwordRef"
          type="password"
          v-model="password"
          :placeholder="$t('password')"
          :readonly="isConnecting"
        />
      </FormInputWrapper>
      <UiButton
        type="submit"
        :busy="isConnecting"
        :disabled="password.trim().length < 1"
      >
        {{ $t("login") }}
      </UiButton>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FormInput from "@/components/form/FormInput.vue";
import FormInputWrapper from "@/components/form/FormInputWrapper.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { useXenApiStore } from "@/stores/xen-api.store";

const { t } = useI18n();
const xenApiStore = useXenApiStore();
const { isConnecting } = storeToRefs(xenApiStore);
const login = ref("root");
const password = ref("");
const error = ref<string>();
const passwordRef = ref<InstanceType<typeof FormInput>>();
const isInvalidPassword = ref(false);

const focusPasswordInput = () => passwordRef.value?.focus();

onMounted(() => {
  xenApiStore.reconnect();
  focusPasswordInput();
});

watch(password, () => {
  isInvalidPassword.value = false;
  error.value = undefined;
});

async function handleSubmit() {
  try {
    await xenApiStore.connect(login.value, password.value);
  } catch (err) {
    if ((err as Error).message === "SESSION_AUTHENTICATION_FAILED") {
      focusPasswordInput();
      isInvalidPassword.value = true;
      error.value = t("password-invalid");
    } else {
      error.value = t("error-occured");
      console.error(err);
    }
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
  background-color: var(--background-color-primary);
}

form {
  display: flex;
  font-size: 2rem;
  min-width: 30em;
  max-width: 100%;
  align-items: center;
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
  margin-bottom: 5rem;
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
  margin-top: 2rem;
}
</style>
