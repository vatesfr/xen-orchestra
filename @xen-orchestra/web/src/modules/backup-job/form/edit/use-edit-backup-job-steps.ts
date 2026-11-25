import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { BackupJobFormDataStep, BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import type { BackupJobFormDataSet } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { isEqual } from 'lodash-es'
import { ref, shallowRef } from 'vue'

export function useEditBackupJobSteps(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule) {
  const appliedFormDataSet = shallowRef(getBackupJobFormInitialData(backupJob, schedule))

  const currentStep = ref<BackupJobFormStep>('review')

  const hasRemovedTargetBackupRepository = ref(false)

  function openStep(step: BackupJobFormDataStep) {
    currentStep.value = step
  }

  function cancelStep() {
    hasRemovedTargetBackupRepository.value = false
    currentStep.value = 'review'
  }

  function applyStep(formDataSet: BackupJobFormDataSet) {
    hasRemovedTargetBackupRepository.value =
      currentStep.value === 'source' &&
      appliedFormDataSet.value.source.sourceBackupRepository !== formDataSet.source.sourceBackupRepository &&
      !isEqual(
        appliedFormDataSet.value.target.backupRepository.backupRepositoryIds,
        formDataSet.target.backupRepository.backupRepositoryIds
      )

    appliedFormDataSet.value = formDataSet
    currentStep.value = hasRemovedTargetBackupRepository.value ? 'target' : 'review'
  }

  return {
    appliedFormDataSet,
    currentStep,
    hasRemovedTargetBackupRepository,
    openStep,
    cancelStep,
    applyStep,
  }
}
