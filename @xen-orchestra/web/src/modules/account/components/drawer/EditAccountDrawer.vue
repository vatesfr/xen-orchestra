<template>
  <UiDrawer @confirm="onConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-account') }}</template>

    <template #content>
      <VtsRequiredHint />

      <div class="form">
        <FormTextInput v-bind="usernameInputBindings" />
        <FormTextInput v-bind="firstnameInputBindings" />
        <FormTextInput v-bind="lastnameInputBindings" />
        <FormTextInput v-bind="emailInputBindings" />
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
import { useEditAccountForm } from '@/modules/account/form/use-edit-account-form.ts'
import type { EditXoUserPayload } from '@/modules/user/jobs/xo-user-edit.job.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import type { XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: EditXoUserPayload]
}>()

const { t } = useI18n()

const {
  usernameInputBindings,
  firstnameInputBindings,
  lastnameInputBindings,
  emailInputBindings,
  validateAndBuildPayload,
} = useEditAccountForm(user)

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
}
</style>
