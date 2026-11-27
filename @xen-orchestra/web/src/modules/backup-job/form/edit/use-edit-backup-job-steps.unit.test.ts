import { useEditBackupJobSteps } from '@/modules/backup-job/form/edit/use-edit-backup-job-steps.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import type { BackupJobFormDataSet } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { cloneDeep } from 'lodash-es'

const SCHEDULE = createSchedule({ cron: '0 3 * * *' })

const SOURCE_BR = 'br-source' as FrontXoBackupRepository['id']
const OTHER_SOURCE_BR = 'br-other-source' as FrontXoBackupRepository['id']
const TARGET_BR = 'br-target' as FrontXoBackupRepository['id']
const OTHER_TARGET_BR = 'br-other-target' as FrontXoBackupRepository['id']

const MIRROR_JOB = createMirrorBackupJob({ name: 'Mirror job', sourceRemote: SOURCE_BR, remotes: { id: TARGET_BR } })

function useSteps(backupJob: FrontAnyXoBackupJob = MIRROR_JOB) {
  return useEditBackupJobSteps(backupJob, SCHEDULE)
}

function editCopy(appliedFormDataSet: BackupJobFormDataSet, edit: (formDataSet: BackupJobFormDataSet) => void) {
  const formDataSet = cloneDeep(appliedFormDataSet)
  edit(formDataSet)

  return formDataSet
}

describe('initial state', () => {
  it('starts on the review', () => {
    const steps = useSteps()

    expect(steps.currentStep.value).toBe('review')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
  })

  it('applies the data of the job and of its schedule', () => {
    const steps = useSteps(createMetadataBackupJob({ name: 'Metadata job' }))

    expect(steps.appliedFormDataSet.value.source).toMatchObject({ name: 'Metadata job', dataSource: 'metadata' })
    expect(steps.appliedFormDataSet.value.planning.cron).toBe('0 3 * * *')
  })

  it('applies the data the job initial data gives', () => {
    expect(useSteps().appliedFormDataSet.value).toEqual(getBackupJobFormInitialData(MIRROR_JOB, SCHEDULE))
  })
})

describe('openStep', () => {
  it('opens the given step', () => {
    const steps = useSteps()

    steps.openStep('target')

    expect(steps.currentStep.value).toBe('target')
  })
})

describe('cancelStep', () => {
  it('goes back to the review, keeping the applied data', () => {
    const steps = useSteps()
    const appliedFormDataSet = steps.appliedFormDataSet.value
    steps.openStep('planning')

    steps.cancelStep()

    expect(steps.currentStep.value).toBe('review')
    expect(steps.appliedFormDataSet.value).toBe(appliedFormDataSet)
  })

  it('forgets that a target backup repository was removed', () => {
    const steps = useSteps()
    steps.openStep('source')
    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.source.sourceBackupRepository = OTHER_SOURCE_BR
        formDataSet.target.backupRepository.backupRepositoryIds = [OTHER_TARGET_BR]
      })
    )
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(true)

    steps.cancelStep()

    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
    expect(steps.currentStep.value).toBe('review')
  })
})

describe('applyStep', () => {
  it('applies the edited data and goes back to the review', () => {
    const steps = useSteps()
    steps.openStep('planning')
    const formDataSet = editCopy(steps.appliedFormDataSet.value, formDataSet => {
      formDataSet.planning.cron = '0 5 * * *'
    })

    steps.applyStep(formDataSet)

    expect(steps.appliedFormDataSet.value).toBe(formDataSet)
    expect(steps.appliedFormDataSet.value.planning.cron).toBe('0 5 * * *')
    expect(steps.currentStep.value).toBe('review')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
  })

  it('opens the target when the source backup repository changes and the target backup repositories change too', () => {
    const steps = useSteps()
    steps.openStep('source')

    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.source.sourceBackupRepository = OTHER_SOURCE_BR
        formDataSet.target.backupRepository.backupRepositoryIds = []
      })
    )

    expect(steps.currentStep.value).toBe('target')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(true)
    expect(steps.appliedFormDataSet.value.source.sourceBackupRepository).toBe(OTHER_SOURCE_BR)
  })

  it('goes back to the review when the source backup repository changes but the targets do not', () => {
    const steps = useSteps()
    steps.openStep('source')

    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.source.sourceBackupRepository = OTHER_SOURCE_BR
      })
    )

    expect(steps.currentStep.value).toBe('review')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
  })

  it('goes back to the review when the target backup repositories change but not the source one', () => {
    const steps = useSteps()
    steps.openStep('source')

    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.target.backupRepository.backupRepositoryIds = [OTHER_TARGET_BR]
      })
    )

    expect(steps.currentStep.value).toBe('review')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
  })

  it('goes back to the review when the source backup repository changes from another step than the source', () => {
    const steps = useSteps()
    steps.openStep('target')

    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.source.sourceBackupRepository = OTHER_SOURCE_BR
        formDataSet.target.backupRepository.backupRepositoryIds = []
      })
    )

    expect(steps.currentStep.value).toBe('review')
    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
  })

  it('forgets a removed target backup repository once the next step is applied', () => {
    const steps = useSteps()
    steps.openStep('source')
    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.source.sourceBackupRepository = OTHER_SOURCE_BR
        formDataSet.target.backupRepository.backupRepositoryIds = []
      })
    )

    steps.applyStep(
      editCopy(steps.appliedFormDataSet.value, formDataSet => {
        formDataSet.target.backupRepository.backupRepositoryIds = [TARGET_BR]
      })
    )

    expect(steps.hasRemovedTargetBackupRepository.value).toBe(false)
    expect(steps.currentStep.value).toBe('review')
  })
})
