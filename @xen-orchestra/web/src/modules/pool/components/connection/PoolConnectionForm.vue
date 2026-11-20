<template>
  <div class="connection-form" :class="{ mobile: uiStore.isSmall }">
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
  </div>
</template>

<script setup lang="ts">
import { usePoolConnectionForm } from '@/modules/pool/form/use-pool-connection-form.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const uiStore = useUiStore()

const {
  validate,
  payload,
  hostInputBindings,
  httpProxyInputBindings,
  usernameInputBindings,
  passwordInputBindings,
  readOnlyCheckboxBindings,
  allowUnauthorizedCheckboxBindings,
} = usePoolConnectionForm()

async function validateAndBuildPayload() {
  if (!(await validate())) {
    return undefined
  }

  return payload.value
}

defineExpose({
  validate: validateAndBuildPayload,
})
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
