<template>
  <UiDrawer @confirm="emit('confirm', buildPayload())" @dismiss="emit('cancel')">
    <template #title>{{ token ? t('action:edit-authentication-token') : t('action:new-authentication-token') }}</template>

    <template #content>
      <div class="form">
        <FormTextInput v-model="formData.description" :label="t('description')" />
        <AuthenticationTokenFormDateInput
          v-if="!token"
          v-model="formData.expirationDate"
          :label="t('expiration-date')"
          :info="t('authentication-token-expiration-info')"
          :min="minExpirationDate"
          :max="maxExpirationDate"
        />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ token ? t('action:save') : t('action:create') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import AuthenticationTokenFormDateInput from '@/modules/account/components/form/inputs/AuthenticationTokenFormDateInput.vue'
import { useAuthenticationTokenForm } from '@/modules/account/form/use-authentication-token-form.ts'
import type { NewAuthenticationTokenPayload } from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
import type { EditAuthenticationTokenPayload } from '@/modules/account/jobs/xo-authentication-token-edit.job.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import type { XoAuthenticationToken } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { token } = defineProps<{
  token?: XoAuthenticationToken
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: NewAuthenticationTokenPayload | EditAuthenticationTokenPayload]
}>()

const { t } = useI18n()

const { formData, minExpirationDate, maxExpirationDate, buildPayload } = useAuthenticationTokenForm(token)
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
}
</style>
