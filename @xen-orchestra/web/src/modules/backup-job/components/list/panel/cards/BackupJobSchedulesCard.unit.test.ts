import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { getScheduleNextRun } from '@/modules/schedule/utils/xo-schedule.util.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardCounter } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { findLink } from '@core-test/find-links.ts'
import { findStatuses } from '@core-test/find-statuses.ts'
import { mount } from '@vue/test-utils'

mockXoRoutes()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T10:30:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountSchedulesCard(schedules: FrontXoSchedule[]) {
  return mount(BackupJobSchedulesCard, {
    props: { schedules },
    global: createGlobalTestConfig(),
  })
}

it('shows the name, id, cron pattern and next run of a single schedule, without its status', () => {
  const schedule = createSchedule({ name: 'Nightly', cron: '0 1 * * *' })
  const nextRun = getScheduleNextRun(schedule)
  const wrapper = mountSchedulesCard([schedule])

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('name')]: 'Nightly',
    [t('id')]: schedule.id,
    [t('cron-pattern')]: '0 1 * * *',
    [t('next-run')]: nextRun !== undefined ? formatDateTime(nextRun) : '',
  })
})

it('links the schedule to the XO 5 backup overview', () => {
  expect(findLink(mountSchedulesCard([createSchedule()]))).toMatchObject({
    href: 'https://xo5.example.com/#/backup/overview',
    icon: 'object:backup-schedule',
  })
})

it('names a schedule without name as untitled', () => {
  expect(findCardLabelledValues(mountSchedulesCard([createSchedule({ name: '' })]))[t('name')]).toBe(t('untitled'))
})

it('has no next run for a disabled schedule', () => {
  const labelledValues = findCardLabelledValues(mountSchedulesCard([createSchedule({ enabled: false })]))

  expect(labelledValues[t('next-run')]).toBe('')
})

it('shows the status of each schedule when there are several', () => {
  const wrapper = mountSchedulesCard([
    createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], enabled: true }),
    createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'], enabled: false }),
  ])

  expect(findStatuses(wrapper)).toEqual([true, false])
})

it('counts the schedules and separates them', () => {
  const wrapper = mountSchedulesCard([
    createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'] }),
    createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'] }),
  ])

  expect(findPanelCardCounter(wrapper)).toBe(2)
  expect(wrapper.findAllComponents(VtsDivider)).toHaveLength(1)
})
