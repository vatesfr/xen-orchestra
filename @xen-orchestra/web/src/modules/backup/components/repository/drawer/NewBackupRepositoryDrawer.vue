<template>
  <UiDrawer class="new-backup-repository-drawer" @confirm="next()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('create-new-br') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="currentStepIndex">
        <NewBackupRepositoryGeneralStep
          v-if="currentStep === 'general'"
          :name-input-bindings
          :type-select-bindings
          :backup-format-select-bindings
          :proxy-select-bindings
          :encrypted-checkbox-bindings
          :encryption-key-input-bindings
        />
        <NewBackupRepositoryDetailsStep
          v-else-if="currentStep === 'details'"
          :type="selectedType"
          :azure-host-name-input-bindings
          :azure-account-name-input-bindings
          :azure-key-input-bindings
          :azure-container-name-input-bindings
          :azure-path-in-container-input-bindings
        />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep === 'general'" @click="emit('cancel')" />
      <VtsOverlayCancelButton v-else @click="back()">{{ t('back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('continue') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import NewBackupRepositoryDetailsStep from '@/modules/backup/components/repository/form/new/NewBackupRepositoryDetailsStep.vue'
import NewBackupRepositoryGeneralStep from '@/modules/backup/components/repository/form/new/NewBackupRepositoryGeneralStep.vue'
import { useNewBackupRepositoryForm } from '@/modules/backup/form/new/use-new-backup-repository-form.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const {
  currentStep,
  selectedType,
  next,
  back,
  nameInputBindings,
  typeSelectBindings,
  backupFormatSelectBindings,
  proxySelectBindings,
  encryptedCheckboxBindings,
  encryptionKeyInputBindings,
  azureHostNameInputBindings,
  azureAccountNameInputBindings,
  azureKeyInputBindings,
  azureContainerNameInputBindings,
  azurePathInContainerInputBindings,
} = useNewBackupRepositoryForm()

const currentStepIndex = computed(() => (currentStep.value === 'general' ? 0 : 1))

const detailsStepLabel = computed(() => {
  switch (selectedType.value) {
    case 'azure':
      return t('azure-details')
    case 'azurite':
      return t('azurite-details')
    case 'nfs':
      return t('nfs-details')
    default:
      return ''
  }
})

const steps = computed(() => [{ label: t('br-details') }, { label: detailsStepLabel.value }, { label: '' }])
</script>

<style lang="postcss" scoped>
.new-backup-repository-drawer {
  .content {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    text-align: left;
  }
}
</style>
