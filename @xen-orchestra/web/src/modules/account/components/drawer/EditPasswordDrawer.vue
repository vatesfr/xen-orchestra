<template>
  <UiDrawer @confirm="onConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-password') }}</template>

    <template #content>
      <VtsRequiredHint />

      <div class="form">
        <FormPasswordInput v-bind="oldPasswordInputBindings" />
        <div class="new-password">
          <FormPasswordInput v-bind="newPasswordInputBindings" />
          <UiInfo accent="info" wrap>{{ t('password-change-sign-out-info') }}</UiInfo>
        </div>
        <FormPasswordInput v-bind="confirmPasswordInputBindings" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { useChangePasswordForm } from '@/modules/account/form/use-change-password-form.ts'
import type { ChangeXoUserPasswordPayload } from '@/modules/account/jobs/xo-user-password-change.job.ts'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
  confirm: [payload: ChangeXoUserPasswordPayload]
}>()

const { t } = useI18n()

const { oldPasswordInputBindings, newPasswordInputBindings, confirmPasswordInputBindings, validateAndBuildPayload } =
  useChangePasswordForm()

async function onConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin-block-start: 2.4rem;

  .new-password {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
