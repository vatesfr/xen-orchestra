import type { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import BackupLogInfosCard from '@/modules/backup-log/components/list/panel/cards/BackupLogInfosCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itShowsNameAndIdTitle } from '@/test/card-title.ts'
import { createBackupLog, createBackupLogSrTask, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import {
  findCardCopiedValues,
  findCardLabelledValues,
  findCardRowLabels,
  findCardRows,
  findCardRowLink,
  hasCardRowCopy,
} from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLink } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { formatDateTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const useGetBackupJobById = vi.fn()

mockXoRoutes()

mockModule(import('@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({ useGetBackupJobById })) as unknown as typeof useXoBackupJobCollection,
}))

mockXoVmCollection()

mockXoCollections('host', 'pbd', 'sr')

beforeEach(() => {
  useGetBackupJobById.mockReset()
  vmCollectionMock.reset()
  xoCollectionsMock.reset()

  mockBackupJob({ name: 'QA delta' })
})

function mockBackupJob(backupJob: { name: string; type?: string } | undefined) {
  useGetBackupJobById.mockReturnValue(computed(() => backupJob))
}

function mountCard(backupLog: FrontXoBackupLog = createBackupLog()) {
  return mount(BackupLogInfosCard, {
    props: { backupLog },
    global: createGlobalTestConfig(),
  })
}

describe('title', () => {
  const titledLog = createBackupLog({ id: 'backup-log-42' as FrontXoBackupLog['id'] })

  itShowsNameAndIdTitle(
    () => mountCard(titledLog),
    { label: t('log-name', { date: formatDateTime(titledLog.start) }), id: 'backup-log-42', icon: 'object:backup-run' },
    'names the log after its start date, with the backup log icon, and shows its id'
  )

  it('links to the detail page of the log', () => {
    expect(findPanelCardTitleLink(mountCard(titledLog))?.href).toBe('/admin/backup-log/backup-log-42/general')
  })
})

it('lists every row of the card, in order', () => {
  const wrapper = mountCard()

  expect(findCardRowLabels(wrapper)).toEqual([t('backup-date'), t('duration'), t('vm'), t('job'), t('sr'), t('status')])
})

it('shows the information of the log and offers to copy them', () => {
  vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' })]
  xoCollectionsMock.srs.value = [createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Alpha-Backup-SR' })]

  const backupLog = createBackupLog({
    start: 1_700_000_000_000,
    end: 1_700_000_014_000,
    status: 'success',
    tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')])],
  })

  const wrapper = mountCard(backupLog)
  const backupDate = formatDateTime(backupLog.start)

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('backup-date')]: backupDate,
    [t('duration')]: '00:00:14',
    [t('vm')]: 'Alpha VM',
    [t('job')]: 'QA delta',
    [t('sr')]: 'Alpha-Backup-SR',
    [t('status')]: t('success'),
  })
  expect(findCardCopiedValues(wrapper)).toEqual([backupDate, '00:00:14', 'Alpha VM', 'QA delta', 'Alpha-Backup-SR'])
})

describe('VM', () => {
  it('shows one row per VM, labelled on the first one only, and a VM not found without copy', () => {
    vmCollectionMock.vms.value = [
      createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' }),
      createVm({ id: 'vm-3' as FrontXoVm['id'], name_label: 'Gamma VM' }),
    ]

    const wrapper = mountCard(
      createBackupLog({
        tasks: [createBackupLogVmTask('vm-1'), createBackupLogVmTask('vm-2'), createBackupLogVmTask('vm-3')],
      })
    )

    const vmRows = findCardRows(wrapper).slice(2, 5)

    expect(vmRows).toEqual([
      [t('vm'), 'Alpha VM'],
      ['', t('vm-not-found')],
      ['', 'Gamma VM'],
    ])
    expect(hasCardRowCopy(wrapper, '')).toBe(false)
    expect(findCardCopiedValues(wrapper)).toContain('Alpha VM')
    expect(findCardCopiedValues(wrapper)).toContain('Gamma VM')
  })

  it('links a VM to its dashboard, with the icon of its power state', () => {
    vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'] })]

    expect(
      findCardRowLink(mountCard(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })), t('vm'))
    ).toMatchObject({
      href: '/vm/vm-1/dashboard',
      icon: objectIcon('vm', 'running'),
    })
  })
})

describe('SR', () => {
  it('shows one row per SR, labelled on the first one only, and the id of an SR not found', () => {
    xoCollectionsMock.srs.value = [createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Alpha-Backup-SR' })]

    const wrapper = mountCard(
      createBackupLog({
        tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1'), createBackupLogSrTask('sr-2')])],
      })
    )

    const srRows = findCardRows(wrapper).slice(4, 6)

    expect(srRows).toEqual([
      [t('sr'), 'Alpha-Backup-SR'],
      ['', 'sr-2'],
    ])
    expect(findCardCopiedValues(wrapper)).toEqual(expect.arrayContaining(['Alpha-Backup-SR', 'sr-2']))
  })

  it('links an SR to its page', () => {
    xoCollectionsMock.srs.value = [createSr({ id: 'sr-1' as FrontXoSr['id'] })]

    const wrapper = mountCard(
      createBackupLog({ tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')])] })
    )

    expect(findCardRowLink(wrapper, t('sr'))?.href).toBe('/sr/sr-1/general')
  })
})

describe('job', () => {
  it('links the job to the backup repositories settings of XO 5', () => {
    const wrapper = mountCard()

    expect(findCardRowLink(wrapper, t('job'))?.href).toBe('https://xo5.example.com/#/settings/remotes')
  })
})

it.each([
  {
    label: 'the VM empty for a log of a job without VM',
    backupJob: { name: 'QA metadata', type: 'metadataBackup' },
    backupLog: createBackupLog({ tasks: [] }),
    row: t('vm'),
    value: '',
  },
  {
    label: 'a VM not found for a log of a VM backup without VM',
    backupJob: { name: 'QA delta', type: 'backup' },
    backupLog: createBackupLog({ tasks: [] }),
    row: t('vm'),
    value: t('vm-not-found'),
  },
  {
    label: 'the SR empty for a log without SR',
    backupJob: { name: 'QA delta' },
    backupLog: createBackupLog({ tasks: [] }),
    row: t('sr'),
    value: '',
  },
  {
    label: 'an unknown job as untitled',
    backupJob: undefined,
    backupLog: createBackupLog(),
    row: t('job'),
    value: t('untitled'),
  },
  {
    label: 'the duration empty for a log that has not ended',
    backupJob: { name: 'QA delta' },
    backupLog: createBackupLog({ end: undefined }),
    row: t('duration'),
    value: '',
  },
])('shows $label, not copyable', ({ backupJob, backupLog, row, value }) => {
  mockBackupJob(backupJob)

  const wrapper = mountCard(backupLog)

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [row]: value })
  expect(hasCardRowCopy(wrapper, row)).toBe(false)
})
