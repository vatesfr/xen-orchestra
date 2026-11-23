<template>
  <div class="new">
    <UiHeadBar icon="fa:plus">
      {{ t('new-vm') }}
    </UiHeadBar>
    <div ref="container" class="card-container">
      <VtsOperationPendingCard v-if="isCreating" :title="t('new-vm:provisioning-n-vms', 1)">
        <template #message>
          <p class="typo-body-bold-small">{{ t('leave-page-safely') }}</p>
          <I18nT keypath="new-vm:creation-in-progress-message" scope="global" tag="p">
            <template #tasksPageLink>
              <UiLink size="small" :to="tasksRoute">{{ t('tasks-page') }}</UiLink>
            </template>
          </I18nT>
        </template>
      </VtsOperationPendingCard>

      <VtsOperationErrorCard
        v-else-if="creationError"
        :title="t('unable-to-provision-new-vm')"
        :error="creationError"
        :error-message="t('new-vm:error-message')"
      >
        <template #actions>
          <UiButton variant="secondary" accent="brand" size="medium" @click="dismissCreationError()">
            {{ t('action:go-back') }}
          </UiButton>
        </template>
      </VtsOperationErrorCard>

      <UiCard v-show="canDisplayForm">
        <VtsForm class="form" @submit="submit()">
          <div ref="stepper" class="stepper" tabindex="-1">
            <UiStepper :steps :current-step="currentStepIndex" />
          </div>
          <NewVmEnvironmentStep v-if="currentStep === 'environment'" />
          <NewVmConfigurationStep v-else-if="currentStep === 'configuration'" />
          <NewVmReviewStep v-else />
          <NewVmWizardActions
            :step="currentStep"
            :can-create
            :busy="isCreateJobRunning"
            @back="back()"
            @cancel="cancel()"
          />
        </VtsForm>
      </UiCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NewVmWizardActions from '@/modules/vm/components/new/NewVmWizardActions.vue'
import NewVmConfigurationStep from '@/modules/vm/components/new/steps/NewVmConfigurationStep.vue'
import NewVmEnvironmentStep from '@/modules/vm/components/new/steps/NewVmEnvironmentStep.vue'
import NewVmReviewStep from '@/modules/vm/components/new/steps/NewVmReviewStep.vue'
import { useNewVmWizard } from '@/modules/vm/composables/use-new-vm-wizard.composable.ts'
import { provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { computed, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  steps,
  currentStep,
  currentStepIndex,
  isCreating,
  isCreateJobRunning,
  canCreate,
  creationError,
  tasksRoute,
  next,
  back,
  cancel,
  create,
  dismissCreationError,
} = useNewVmWizard(provideNewVmForm())

const container = useTemplateRef('container')

const stepper = useTemplateRef('stepper')

const canDisplayForm = computed(() => !isCreating.value && creationError.value === undefined)

function submit() {
  return currentStep.value === 'review' ? create() : next()
}

watch(
  currentStep,
  () => {
    container.value?.scrollTo({ top: 0 })
    stepper.value?.focus({ preventScroll: true })
  },
  { flush: 'post' }
)
</script>

<style lang="postcss" scoped>
.new {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .card-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.8rem;
  }

  .stepper {
    outline: none;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }
}
</style>
