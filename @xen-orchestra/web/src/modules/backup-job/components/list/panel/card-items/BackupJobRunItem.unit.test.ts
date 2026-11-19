import BackupJobRunItem from '@/modules/backup-job/components/list/panel/card-items/BackupJobRunItem.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createBackupLog, createBackupLogTask } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { findCardLabelledValues, getCardRow, getCardRowLink } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

const schedule = createSchedule({ id: 'schedule-789' as FrontXoSchedule['id'], name: 'Nightly' })

beforeEach(() => {
  scheduleCollectionMock.schedules.value = [schedule]
})

function mountRun(backupRun: FrontXoBackupLog) {
  return mount(BackupJobRunItem, {
    props: { backupRun },
    global: createGlobalTestConfig(),
  })
}

it('links the run to its log in the administration and dates it by its end', () => {
  const backupRun = createBackupLog({ start: 1_700_000_000_000, end: 1_700_000_014_000 })
  const wrapper = mountRun(backupRun)

  expect(wrapper.getComponent(UiLink).attributes('href')).toBe(`/admin/backup-and-replication/logs?id=${backupRun.id}`)
  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('run')]: backupRun.id,
    [t('date')]: formatDateTime(1_700_000_014_000),
    [t('status')]: t('success'),
    [t('schedule')]: 'Nightly',
  })
})

it('dates a run still in progress by its start', () => {
  const wrapper = mountRun(createBackupLog({ status: 'pending', start: 1_700_000_000_000, end: undefined }))

  expect(findCardLabelledValues(wrapper)[t('date')]).toBe(formatDateTime(1_700_000_000_000))
})

describe('schedule', () => {
  it('links the schedule of the run to the XO 5 backup overview', () => {
    const scheduleLink = getCardRowLink(mountRun(createBackupLog()), t('schedule'))

    expect(scheduleLink.text()).toBe('Nightly')
    expect(scheduleLink.attributes('href')).toBe('https://xo5.example.com/#/backup/overview')
  })

  it('names a schedule without name as untitled', () => {
    scheduleCollectionMock.schedules.value = [{ ...schedule, name: '' }]

    expect(findCardLabelledValues(mountRun(createBackupLog()))[t('schedule')]).toBe(t('untitled'))
  })

  it('shows the id of a deleted schedule, without link', () => {
    scheduleCollectionMock.schedules.value = []

    const wrapper = mountRun(createBackupLog())

    expect(findCardLabelledValues(wrapper)[t('schedule')]).toBe('schedule-789')
    expect(getCardRow(wrapper, t('schedule')).findComponent(UiLink).exists()).toBe(false)
  })
})

describe('error', () => {
  it('shows no error for a successful run', () => {
    expect(
      mountRun(createBackupLog({ status: 'success' }))
        .findComponent(UiLogEntryViewer)
        .exists()
    ).toBe(false)
  })

  it('shows the error of a failed run', () => {
    const result = { message: 'Disk write error' }
    const viewer = mountRun(createBackupLog({ status: 'failure', result })).getComponent(UiLogEntryViewer)

    expect(viewer.props()).toMatchObject({ content: result, label: t('api-error-details'), accent: 'danger' })
  })

  it('shows the reason of a skipped run as a warning', () => {
    const result = { message: 'no VMs match this pattern' }
    const viewer = mountRun(createBackupLog({ status: 'skipped', result })).getComponent(UiLogEntryViewer)

    expect(viewer.props()).toMatchObject({ content: result, label: t('api-warning-details'), accent: 'warning' })
  })

  it('shows the error of a task of the run', () => {
    const result = { message: 'Snapshot failed' }
    const viewer = mountRun(
      createBackupLog({ status: 'failure', tasks: [createBackupLogTask({ status: 'failure', result })] })
    ).getComponent(UiLogEntryViewer)

    expect(viewer.props('content')).toEqual(result)
  })

  it('tells the error is unknown for a failed run without error', () => {
    const viewer = mountRun(createBackupLog({ status: 'failure' })).getComponent(UiLogEntryViewer)

    expect(viewer.props('content')).toBe(t('unknown-error'))
  })

  it('tells the run was interrupted when it has no error', () => {
    const viewer = mountRun(createBackupLog({ status: 'interrupted' })).getComponent(UiLogEntryViewer)

    expect(viewer.props('content')).toBe(t('run-interrupted'))
  })
})
