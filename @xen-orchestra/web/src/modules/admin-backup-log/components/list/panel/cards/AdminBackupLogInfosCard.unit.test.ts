import AdminBackupLogInfosCard from '@/modules/admin-backup-log/components/list/panel/cards/AdminBackupLogInfosCard.vue'
import type { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { formatBackupLogDate } from '@/modules/backup/utils/xo-backup-log.util.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createBackupLog, createBackupLogSrTask, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { d, t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { buildXo5Route, useGetBackupJobById, getVmById, getSrById } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
  useGetBackupJobById: vi.fn(),
  getVmById: vi.fn(),
  getSrById: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({ useGetBackupJobById })) as unknown as typeof useXoBackupJobCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ getVmById })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ getSrById })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => [],
    pbdsBySr: ref(new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
  useGetBackupJobById.mockReset()
  getVmById.mockReset()
  getSrById.mockReset()

  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
  mockBackupJob({ name: 'QA delta' })
  mockVms([])
  mockSrs([])
})

function mockBackupJob(backupJob: { name: string; type?: string } | undefined) {
  useGetBackupJobById.mockReturnValue(computed(() => backupJob))
}

function mockVms(vms: FrontXoVm[]) {
  getVmById.mockImplementation((id: FrontXoVm['id']) => vms.find(vm => vm.id === id))
}

function mockSrs(srs: FrontXoSr[]) {
  getSrById.mockImplementation((id: FrontXoSr['id']) => srs.find(sr => sr.id === id))
}

function mountCard(backupLog: FrontXoBackupLog = createBackupLog()) {
  return mount(AdminBackupLogInfosCard, {
    props: { backupLog },
    global: createGlobalTestConfig(),
  })
}

function formatDate(timestamp: number) {
  return d(timestamp, { dateStyle: 'short', timeStyle: 'medium' })
}

function findRows(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.vts-card-row-key-value').map(row => [row.get('.key').text(), row.get('.value').text()])
}

function findRow(wrapper: ReturnType<typeof mountCard>, key: string) {
  const row = wrapper.findAll('.vts-card-row-key-value').find(row => row.get('.key').text() === key)

  if (row === undefined) {
    throw new Error(`No row labelled "${key}"`)
  }

  return row
}

describe('title', () => {
  it('names the log after its start date and shows its id', () => {
    const backupLog = createBackupLog({ id: 'backup-log-42' as FrontXoBackupLog['id'] })

    const title = mountCard(backupLog).get('.ui-panel-card-title')

    expect(title.text()).toContain(t('log-name', { date: formatBackupLogDate(backupLog.start) }))
    expect(title.text()).toContain('backup-log-42')
  })

  it('links to the backup repositories settings of XO 5', () => {
    const wrapper = mountCard()

    expect(wrapper.findComponent(UiPanelCardTitle).findComponent(UiLink).props('href')).toBe(
      'https://xo5.example.com/#/settings/remotes'
    )
  })

  it('shows the backup log icon', () => {
    const wrapper = mountCard()

    expect(wrapper.findComponent(UiPanelCardTitle).props('icon')).toBe('object:backup-run')
  })
})

it('lists every row of the card, in order', () => {
  const wrapper = mountCard()

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual([
    t('backup-date'),
    t('duration'),
    t('vm'),
    t('job'),
    t('sr'),
    t('status'),
  ])
})

it('shows the information of the log and offers to copy them', () => {
  mockVms([createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' })])
  mockSrs([createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Alpha-Backup-SR' })])

  const backupLog = createBackupLog({
    start: 1_700_000_000_000,
    end: 1_700_000_014_000,
    status: 'success',
    tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')])],
  })

  const wrapper = mountCard(backupLog)
  const backupDate = formatDate(backupLog.start)

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
    mockVms([
      createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' }),
      createVm({ id: 'vm-3' as FrontXoVm['id'], name_label: 'Gamma VM' }),
    ])

    const wrapper = mountCard(
      createBackupLog({
        tasks: [createBackupLogVmTask('vm-1'), createBackupLogVmTask('vm-2'), createBackupLogVmTask('vm-3')],
      })
    )

    const vmRows = findRows(wrapper).slice(2, 5)

    expect(vmRows).toEqual([
      [t('vm'), 'Alpha VM'],
      ['', t('vm-not-found')],
      ['', 'Gamma VM'],
    ])
    expect(findRow(wrapper, '').findAll('.copy-button')).toHaveLength(0)
    expect(findCardCopiedValues(wrapper)).toContain('Alpha VM')
    expect(findCardCopiedValues(wrapper)).toContain('Gamma VM')
  })

  it('links a VM to its dashboard, with the icon of its power state', () => {
    mockVms([createVm({ id: 'vm-1' as FrontXoVm['id'] })])

    const vmLink = findRow(
      mountCard(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })),
      t('vm')
    ).getComponent(UiLink)

    expect(vmLink.attributes('href')).toBe('/vm/vm-1/dashboard')
    expect(vmLink.props('icon')).toBe(objectIcon('vm', 'running'))
  })

  it('leaves the VM empty and not copyable for a log of a job without VM', () => {
    mockBackupJob({ name: 'QA metadata', type: 'metadataBackup' })

    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vm')]: '' })
    expect(findRow(wrapper, t('vm')).find('.copy-button').exists()).toBe(false)
  })

  it('shows a VM not found, without copy, for a log of a VM backup without VM', () => {
    mockBackupJob({ name: 'QA delta', type: 'backup' })

    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vm')]: t('vm-not-found') })
    expect(findRow(wrapper, t('vm')).find('.copy-button').exists()).toBe(false)
  })
})

describe('SR', () => {
  it('shows one row per SR, labelled on the first one only, and the id of an SR not found', () => {
    mockSrs([createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Alpha-Backup-SR' })])

    const wrapper = mountCard(
      createBackupLog({
        tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1'), createBackupLogSrTask('sr-2')])],
      })
    )

    const srRows = findRows(wrapper).slice(4, 6)

    expect(srRows).toEqual([
      [t('sr'), 'Alpha-Backup-SR'],
      ['', 'sr-2'],
    ])
    expect(findCardCopiedValues(wrapper)).toEqual(expect.arrayContaining(['Alpha-Backup-SR', 'sr-2']))
  })

  it('links an SR to its page', () => {
    mockSrs([createSr({ id: 'sr-1' as FrontXoSr['id'] })])

    const wrapper = mountCard(
      createBackupLog({ tasks: [createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')])] })
    )

    expect(findRow(wrapper, t('sr')).getComponent(UiLink).attributes('href')).toBe('/sr/sr-1/general')
  })

  it('leaves the SR empty and not copyable for a log without SR', () => {
    const wrapper = mountCard(createBackupLog({ tasks: [] }))

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('sr')]: '' })
    expect(findRow(wrapper, t('sr')).find('.copy-button').exists()).toBe(false)
  })
})

describe('job', () => {
  it('links the job to the backup repositories settings of XO 5', () => {
    const wrapper = mountCard()

    expect(findRow(wrapper, t('job')).getComponent(UiLink).props('href')).toBe(
      'https://xo5.example.com/#/settings/remotes'
    )
  })

  it('shows an unknown job as untitled, without copy', () => {
    mockBackupJob(undefined)

    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('job')]: t('untitled') })
    expect(findRow(wrapper, t('job')).find('.copy-button').exists()).toBe(false)
  })
})

it('leaves the duration empty and not copyable for a log that has not ended', () => {
  const wrapper = mountCard(createBackupLog({ end: undefined }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('duration')]: '' })
  expect(findRow(wrapper, t('duration')).find('.copy-button').exists()).toBe(false)
})
