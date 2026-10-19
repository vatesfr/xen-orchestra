<template>
  <UiCard class="v2v-source-connection-form">
    <UiCardTitle>
      {{ t('v2v:connect-new-vmware-source') }}
      <template #description>{{ t('v2v:vcenter-or-esxi') }}</template>
    </UiCardTitle>
    <V2vPrerequisiteStatus :prerequisite />
    <VtsForm class="form" @submit="emit('submit')">
      <div class="fields">
        <FormTextInput v-bind="form.hostInputBindings" class="host" />
        <FormTextInput v-bind="form.portInputBindings" />
        <FormTextInput v-bind="form.usernameInputBindings" class="credential" />
        <FormPasswordInput ref="passwordInput" v-bind="form.passwordInputBindings" class="credential" />
      </div>
      <div class="option">
        <FormCheckbox v-bind="form.skipSslCheckCheckboxBindings" />
        <span class="typo-body-regular-small hint">{{ t('skip-ssl-check-info') }}</span>
      </div>
      <FormCheckbox v-bind="form.rememberCheckboxBindings" />
      <UiInfo v-if="form.formData.remember" accent="warning" wrap class="remember-warning">
        {{ t('remember-credentials-warning') }}
      </UiInfo>
      <UiAlert v-if="connectionError !== undefined" accent="danger">
        {{ t('error') }}
        <template #description>{{ connectionError }}</template>
      </UiAlert>
      <div class="actions">
        <UiButton accent="brand" variant="secondary" size="medium" @click="emit('cancel')">
          {{ t('cancel') }}
        </UiButton>
        <UiButton
          type="submit"
          accent="brand"
          variant="primary"
          size="medium"
          :busy="isConnecting"
          :disabled="!canConnect"
        >
          {{ t('action:connect') }}
        </UiButton>
      </div>
    </VtsForm>
  </UiCard>
</template>

<script lang="ts" setup>
import V2vPrerequisiteStatus from '@/modules/v2v/components/source/V2vPrerequisiteStatus.vue'
import type { V2vConnectionForm } from '@/modules/v2v/form/use-v2v-connection-form.ts'
import type { V2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { type Reactive, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  form: Reactive<V2vConnectionForm>
  prerequisite: V2vPrerequisiteState
  canConnect: boolean
  isConnecting: boolean
  connectionError: string | undefined
}>()

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const { t } = useI18n()

const passwordInput = useTemplateRef('passwordInput')

defineExpose({ focusPassword: () => passwordInput.value?.focus() })
</script>

<style lang="postcss" scoped>
.v2v-source-connection-form {
  .hint {
    color: var(--color-neutral-txt-secondary);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.2rem;

    .host {
      grid-column: span 3;
    }

    .credential {
      grid-column: span 2;
    }
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.8rem;
  }
}
</style>
