<template>
  <UiDrawer class="new-backup-repository-drawer" @confirm="next()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('create-new-br') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="0">
        <NewBackupRepositoryGeneralStep
          v-if="currentStep === 'general'"
          :name-input-bindings
          :type-select-bindings
          :backup-format-select-bindings
          :proxy-select-bindings
          :encrypted-checkbox-bindings
          :encryption-key-input-bindings
        />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('continue') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
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
  next,
  nameInputBindings,
  typeSelectBindings,
  backupFormatSelectBindings,
  proxySelectBindings,
  encryptedCheckboxBindings,
  encryptionKeyInputBindings,
} = useNewBackupRepositoryForm()

const steps = computed(() => [{ label: t('br-details') }, { label: '' }, { label: '' }])
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
