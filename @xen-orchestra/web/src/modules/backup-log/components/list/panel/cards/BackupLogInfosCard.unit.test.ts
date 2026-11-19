import type { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import BackupLogInfosCard from '@/modules/backup-log/components/list/panel/cards/BackupLogInfosCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLog, createBackupLogSrTask, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { findPanelCardTitle } from '@/test/find-card-title.ts'
import {
  findCardCopiedValues,
  findCardLabelledValues,
  findCardRowLabels,
  findCardRows,
  getCardRowLink,
  hasCardRowCopy,
} from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { objectIcon } from '@core/icons'
import { formatDateTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetBackupJobById } = vi.hoisted(() => ({
  useGetBackupJobById: vi.fn(),
}))

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
  it('names the log after its start date and shows its id', () => {
    const backupLog = createBackupLog({ id: 'backup-log-42' as FrontXoBackupLog['id'] })

    const title = findPanelCardTitle(mountCard(backupLog))

    expect(title).toContain(t('log-name', { date: formatDateTime(backupLog.start) }))
    expect(title).toContain('backup-log-42')
  })

  it('links to the detail page of the log', () => {
    const wrapper = mountCard(createBackupLog({ id: 'backup-log-42' as FrontXoBackupLog['id'] }))

    expect(wrapper.findComponent(UiPanelCardTitle).findComponent(UiLink).attributes('href')).toBe(
      '/admin/backup-log/backup-log-42/general'
    )
  })

  it('shows the backup log icon', () => {
    const wrapper = mountCard()

    expect(wrapper.findComponent(UiPanelCardTitle).props('icon')).toBe('object:backup-run')
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

    const vmLink = getCardRowLink(mountCard(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })), t('vm'))

    expect(vmLink.attributes('href')).toBe('/vm/vm-1/dashboard')
    expect(vmLink.props('icon')).toBe(objectIcon('vm', 'running'))
  })

  it('leaves the VM empty and not copyable for a log of a job without VM', () => {
    mockBackupJob({ name: 'QA metadata', type: 'metadataBackup' })

    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vm')]: '' })
    expect(hasCardRowCopy(wrapper, t('vm'))).toBe(false)
  })

  it('shows a VM not found, without copy, for a log of a VM backup without VM', () => {
    mockBackupJob({ name: 'QA delta', type: 'backup' })

    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vm')]: t('vm-not-found') })
    expect(hasCardRowCopy(wrapper, t('vm'))).toBe(false)
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

    expect(getCardRowLink(wrapper, t('sr')).attributes('href')).toBe('/sr/sr-1/general')
  })

  it('leaves the SR empty and not copyable for a log without SR', () => {
    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('sr')]: '' })
    expect(hasCardRowCopy(wrapper, t('sr'))).toBe(false)
  })
})

describe('job', () => {
  it('links the job to the backup repositories settings of XO 5', () => {
    const wrapper = mountCard()

    expect(getCardRowLink(wrapper, t('job')).props('href')).toBe('https://xo5.example.com/#/settings/remotes')
  })

  it('shows an unknown job as untitled, without copy', () => {
    mockBackupJob(undefined)

    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('job')]: t('untitled') })
    expect(hasCardRowCopy(wrapper, t('job'))).toBe(false)
  })
})

it('leaves the duration empty and not copyable for a log that has not ended', () => {
  const wrapper = mountCard(createBackupLog({ end: undefined }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('duration')]: '' })
  expect(hasCardRowCopy(wrapper, t('duration'))).toBe(false)
})
