import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { getScheduleNextRun } from '@/modules/schedule/utils/xo-schedule.util.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

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

it('shows the name, id, status, cron pattern and next run of a schedule', () => {
  const schedule = createSchedule({ name: 'Nightly', cron: '0 1 * * *' })
  const nextRun = getScheduleNextRun(schedule)
  const wrapper = mountSchedulesCard([schedule])

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('name')]: 'Nightly',
    [t('id')]: schedule.id,
    [t('status')]: t('enabled'),
    [t('cron-pattern')]: '0 1 * * *',
    [t('next-run')]: nextRun !== undefined ? formatDateTime(nextRun) : '',
  })
})

it('links the schedule to the XO 5 backup overview', () => {
  const link = mountSchedulesCard([createSchedule()]).getComponent(UiLink)

  expect(link.attributes('href')).toBe('https://xo5.example.com/#/backup/overview')
  expect(link.props('icon')).toBe('object:backup-schedule')
})

it('names a schedule without name as untitled', () => {
  expect(findCardLabelledValues(mountSchedulesCard([createSchedule({ name: '' })]))[t('name')]).toBe(t('untitled'))
})

it('has no next run for a disabled schedule', () => {
  const labelledValues = findCardLabelledValues(mountSchedulesCard([createSchedule({ enabled: false })]))

  expect(labelledValues[t('status')]).toBe(t('disabled'))
  expect(labelledValues[t('next-run')]).toBe('')
})

it('counts the schedules and separates them', () => {
  const wrapper = mountSchedulesCard([
    createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'] }),
    createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'] }),
  ])

  expect(wrapper.getComponent(UiPanelCardTitle).props('counter')).toBe(2)
  expect(wrapper.findAllComponents(VtsDivider)).toHaveLength(1)
})
