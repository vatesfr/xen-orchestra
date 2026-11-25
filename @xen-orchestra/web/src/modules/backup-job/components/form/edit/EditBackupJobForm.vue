<template>
  <div class="edit-backup-job-form">
    <div class="header">
      <div class="typo-body-regular job-name">{{ appliedFormDataSet.source.name }}</div>
      <div class="typo-h3">{{ stepLabels[step] }}</div>
    </div>

    <template v-if="step === 'review'">
      <UiAlert v-if="invalidSteps.length > 0" class="alert" accent="danger">
        {{ t('some-steps-contain-errors') }}
      </UiAlert>
      <BackupJobReviewStep
        :source
        :transfer="isMetadata ? undefined : transfer"
        :target
        :planning
        :invalid-steps
        @edit="dataStep => emit('edit', dataStep)"
      />
    </template>
    <BackupJobSourceStep v-else-if="step === 'source'" :form="source" />
    <BackupJobTransferStep v-else-if="step === 'transfer'" :bindings="transfer.bindings" :is-incremental :is-mirror />
    <template v-else-if="step === 'target'">
      <UiAlert v-if="hasRemovedTargetBackupRepository" class="alert" accent="warning">
        {{ t('source-backup-repository-removed-from-targets') }}
      </UiAlert>
      <BackupJobTargetStep :form="target" />
    </template>
    <BackupJobPlanningStep v-else :bindings="planning.bindings" :is-metadata />
  </div>
</template>

<script lang="ts" setup>
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import { useEditBackupJobForm } from '@/modules/backup-job/form/edit/use-edit-backup-job-form.ts'
import type { BackupJobFormDataStep, BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { BackupJobFormDataSet } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

const { appliedFormDataSet, scheduleId, step } = defineProps<{
  appliedFormDataSet: BackupJobFormDataSet
  scheduleId: FrontXoSchedule['id']
  step: BackupJobFormStep
  hasRemovedTargetBackupRepository: boolean
}>()

const emit = defineEmits<{
  edit: [step: BackupJobFormDataStep]
}>()

const { t } = useI18n()

const {
  source,
  transfer,
  target,
  planning,
  isIncremental,
  isMirror,
  isMetadata,
  stepLabels,
  invalidSteps,
  validateStepAndCopyFormDataSet,
  validateAndBuildPayload,
} = useEditBackupJobForm(appliedFormDataSet, scheduleId, step)

defineExpose({
  validateStepAndCopyFormDataSet,
  validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.edit-backup-job-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .job-name {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .alert {
    margin-block-start: 2.4rem;
  }
}
</style>
