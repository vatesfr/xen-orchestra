import BackupJobRunItem from '@/modules/backup-job/components/list/panel/card-items/BackupJobRunItem.vue'
import BackupJobLogsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobLogsCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    useGetScheduleById: () => computed(() => undefined),
  })) as unknown as typeof useXoScheduleCollection,
}))

function mountLogsCard(backupLogs: FrontXoBackupLog[]) {
  return mount(BackupJobLogsCard, {
    props: { backupLogs },
    global: createGlobalTestConfig(),
  })
}

it('always titles the last 3 runs, telling which ones have not run', () => {
  const wrapper = mountLogsCard([createBackupLog({ id: 'backup-log-1' as FrontXoBackupLog['id'] })])

  expect(wrapper.findAllComponents(UiPanelCardTitle).map(title => title.props('label'))).toEqual([
    t('last-n-runs', { n: 3 }),
    t('last-run-number', { n: 1 }),
    t('last-run-number', { n: 2 }),
    t('last-run-number', { n: 3 }),
  ])
  expect(wrapper.findAllComponents(BackupJobRunItem).map(run => run.props('backupRun').id)).toEqual(['backup-log-1'])
  expect(wrapper.findAll('.no-run').map(noRun => noRun.text())).toEqual([t('no-run'), t('no-run')])
})

it('shows each of the last 3 runs, from the most recent', () => {
  const wrapper = mountLogsCard([
    createBackupLog({ id: 'backup-log-1' as FrontXoBackupLog['id'] }),
    createBackupLog({ id: 'backup-log-2' as FrontXoBackupLog['id'] }),
    createBackupLog({ id: 'backup-log-3' as FrontXoBackupLog['id'] }),
  ])

  expect(wrapper.findAllComponents(BackupJobRunItem).map(run => run.props('backupRun').id)).toEqual([
    'backup-log-1',
    'backup-log-2',
    'backup-log-3',
  ])
  expect(wrapper.find('.no-run').exists()).toBe(false)
})
