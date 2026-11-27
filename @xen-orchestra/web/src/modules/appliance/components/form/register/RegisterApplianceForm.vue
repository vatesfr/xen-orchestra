<template>
  <div class="register-appliance-form">
    <UiTitle>{{ t('appliance:xen-orchestra-account') }}</UiTitle>
    <div class="row">
      <FormTextInput v-bind="emailInputBindings" />
      <FormPasswordInput v-bind="passwordInputBindings" />
    </div>
    <UiLink :href="XO_LINKS.VATES_ACCOUNT" size="small" class="create-account">
      {{ t('appliance:create-account') }}
    </UiLink>
  </div>
</template>

<script lang="ts" setup>
import { useRegisterApplianceForm } from '@/modules/appliance/form/register/use-register-appliance-form.ts'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import { XO_LINKS } from '@/shared/constants.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { emailInputBindings, passwordInputBindings, validateAndBuildPayload } = useRegisterApplianceForm()

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.register-appliance-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .row {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      min-width: 0;
    }

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  .create-account {
    margin-block-start: -1.6rem;
  }
}
</style>
