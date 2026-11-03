import {
  type BackupJobTargetHealthCheckFormData,
  useBackupJobTargetHealthCheckForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const SR_ID = 'sr-1' as FrontXoSr['id']

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ srs: ref([createSr({ id: SR_ID })]) })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: ref([]) })) as unknown as typeof useXoVmCollection,
}))

function createHealthCheckFormData(): BackupJobTargetHealthCheckFormData {
  return {
    healthCheckEnabled: true,
    healthCheckSr: SR_ID,
    healthCheckVmTags: [],
    healthCheckTimeout: 10,
    healthCheckSchedule: 'always',
    healthCheckMonthDays: [],
    healthCheckWeekDays: [],
    healthCheckHours: [],
  }
}

function mountHealthCheckForm(formData: Partial<BackupJobTargetHealthCheckFormData> = {}, isActive = true) {
  return mountComposable(() => {
    const { t } = useI18n()

    return {
      ...useBackupJobTargetHealthCheckForm(reactive({ ...createHealthCheckFormData(), ...formData }), ref(isActive)),
      t,
    }
  }).wrapper.vm
}

describe('validate', () => {
  it('accepts a health check on every run', async () => {
    const form = mountHealthCheckForm()

    expect(await form.validate()).toBe(true)
  })

  it('accepts a disabled health check without SR', async () => {
    const form = mountHealthCheckForm({ healthCheckEnabled: false, healthCheckSr: undefined })

    expect(await form.validate()).toBe(true)
  })

  it('ignores the health check when the section is hidden', async () => {
    const form = mountHealthCheckForm({ healthCheckSr: undefined }, false)

    expect(await form.validate()).toBe(true)
  })

  it('requires the health check SR', async () => {
    const form = mountHealthCheckForm({ healthCheckSr: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.healthCheckSr.error).toMatchObject({ content: form.t('health-check-sr-mandatory') })
  })

  it('requires the timeout', async () => {
    const form = mountHealthCheckForm({ healthCheckTimeout: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.healthCheckTimeout.error).toMatchObject({
      content: form.t('health-check-timeout-mandatory'),
    })
  })

  it('requires a timeout of at least 1 minute', async () => {
    const form = mountHealthCheckForm({ healthCheckTimeout: 0 })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.healthCheckTimeout.error).toMatchObject({
      content: form.t('must-be-at-least-n', { n: 1 }),
    })
  })

  it('requires an hour and a day for a dynamic health check', async () => {
    const form = mountHealthCheckForm({ healthCheckSchedule: 'dynamic' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.healthCheckMonthDays.error).toMatchObject({ content: form.t('select-at-least-one-day') })
    expect(form.bindings.healthCheckHours.error).toMatchObject({ content: form.t('select-at-least-one-hour') })
  })

  it('accepts a dynamic health check on a day of the month', async () => {
    const form = mountHealthCheckForm({
      healthCheckSchedule: 'dynamic',
      healthCheckMonthDays: [1],
      healthCheckHours: [2],
    })

    expect(await form.validate()).toBe(true)
  })
})

describe('getScheduleLabel', () => {
  it('labels the health check frequency', () => {
    const form = mountHealthCheckForm()

    expect(form.getScheduleLabel('always')).toBe(form.t('always'))
    expect(form.getScheduleLabel('dynamic')).toBe(form.t('dynamic-selection'))
  })
})
