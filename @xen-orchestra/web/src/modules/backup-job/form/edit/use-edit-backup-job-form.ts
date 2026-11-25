import { useBackupJobFormBase } from '@/modules/backup-job/form/use-backup-job-form-base.ts'
import type { BackupJobFormDataStep, BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { BackupJobFormDataSet, BackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { whenever } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, ref } from 'vue'

export function useEditBackupJobForm(
  appliedFormDataSet: BackupJobFormDataSet,
  scheduleId: FrontXoSchedule['id'],
  step: BackupJobFormStep
) {
  const { formDataSet, validateStep, getInvalidSteps, buildPayload, ...form } = useBackupJobFormBase(
    cloneDeep(appliedFormDataSet),
    { isEditing: true, scheduleKey: scheduleId }
  )

  const invalidSteps = ref<BackupJobFormDataStep[]>([])

  const areTargetsReady = computed(
    () =>
      form.target.backupRepository.areBackupRepositoriesReady.value && form.target.storageRepository.areSrsReady.value
  )

  whenever(
    areTargetsReady,
    async () => {
      if (step === 'review') {
        invalidSteps.value = await getInvalidSteps()
        return
      }

      await validateStep(step)
    },
    { immediate: true, once: true }
  )

  async function validateStepAndCopyFormDataSet(
    dataStep: BackupJobFormDataStep
  ): Promise<BackupJobFormDataSet | undefined> {
    return (await validateStep(dataStep)) ? cloneDeep(formDataSet) : undefined
  }

  async function validateAndBuildPayload(): Promise<BackupJobPayload | undefined> {
    invalidSteps.value = await getInvalidSteps()

    return invalidSteps.value.length === 0 ? buildPayload() : undefined
  }

  return {
    ...form,
    invalidSteps,
    validateStepAndCopyFormDataSet,
    validateAndBuildPayload,
  }
}
