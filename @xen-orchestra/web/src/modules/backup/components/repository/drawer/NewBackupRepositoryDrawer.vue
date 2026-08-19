<template>
  <UiDrawer class="new-backup-repository-drawer" @confirm="next()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('create-new-br') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="currentStepIndex">
        <NewBackupRepositoryGeneralStep v-if="currentStep === 'general'" :bindings="general.bindings" />
        <NewBackupRepositoryDetailsStep v-else :type="general.formData.type" :details />
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
import { useNewBackupRepositoryForm } from '@/modules/backup/form/use-new-backup-repository-form.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const { general, details, currentStep, currentStepIndex, steps, next, back } = useNewBackupRepositoryForm()
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
