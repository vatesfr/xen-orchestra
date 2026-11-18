<template>
  <UiDrawer @confirm="onConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:new-ssh-key') }}</template>

    <template #content>
      <VtsRequiredHint />

      <div class="form">
        <FormTextInput v-bind="titleInputBindings" />
        <SshKeyFormTextarea v-bind="keyInputBindings" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:create') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import SshKeyFormTextarea from '@/modules/account/components/form/inputs/SshKeyFormTextarea.vue'
import { useNewSshKeyForm } from '@/modules/account/form/use-new-ssh-key-form.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

const { existingSshKeys } = defineProps<{
  existingSshKeys: SshKey[]
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: SshKey]
}>()

const { t } = useI18n()

const { titleInputBindings, keyInputBindings, validateAndBuildPayload } = useNewSshKeyForm(() => existingSshKeys)

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
