import BackupLogSizeAndSpeedCard from '@/modules/backup-log/components/list/panel/cards/BackupLogSizeAndSpeedCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import {
  createBackupLog,
  createBackupLogExportTask,
  createBackupLogTransferTask,
  createBackupLogVmTask,
} from '@/test/create-backup-log.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { mount } from '@vue/test-utils'

function mountCard(backupLog: FrontXoBackupLog = createBackupLog()) {
  return mount(BackupLogSizeAndSpeedCard, {
    props: { backupLog },
    global: createGlobalTestConfig(),
  })
}

function createBackupLogWithTransfer(size: number, durationMs: number) {
  return createBackupLog({
    tasks: [
      createBackupLogVmTask('vm-1', [
        createBackupLogExportTask([createBackupLogTransferTask({ size, start: 0, end: durationMs })]),
      ]),
    ],
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-panel-card-title .title').text()).toBe(t('size-and-speed'))
})

it('lists the size then the speed', () => {
  const wrapper = mountCard()

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual([t('size'), t('speed')])
})

it('shows the transferred size and speed, and offers to copy them', () => {
  const wrapper = mountCard(createBackupLogWithTransfer(2_097_152, 2_000))

  const { value, prefix } = formatSizeRaw(2_097_152, 2)
  const size = `${value} ${prefix}`
  const speed = formatSpeed(1_048_576)

  expect(findCardLabelledValues(wrapper)).toEqual({ [t('size')]: size, [t('speed')]: speed })
  expect(findCardCopiedValues(wrapper)).toEqual([size, speed])
})

it('leaves the size and the speed empty and not copyable without transfer', () => {
  const wrapper = mountCard(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] }))

  expect(findCardLabelledValues(wrapper)).toEqual({ [t('size')]: '', [t('speed')]: '' })
  expect(findCardCopiedValues(wrapper)).toEqual([])
})
