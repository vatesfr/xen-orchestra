import type { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import BackupLogsTable from '@/modules/backup-log/components/list/BackupLogsTable.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createBackupLog, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { getBackupJobById, getVmById } = vi.hoisted(() => ({
  getBackupJobById: vi.fn(),
  getVmById: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({ getBackupJobById })) as unknown as typeof useXoBackupJobCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ getVmById })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ getSrById: () => undefined })) as unknown as typeof useXoSrCollection,
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
  getBackupJobById.mockReset()
  getVmById.mockReset()

  mockBackupJob({ name: 'QA delta', type: 'backup' })
  mockVms([])
})

function mockBackupJob(backupJob: { name: string; type: string } | undefined) {
  getBackupJobById.mockReturnValue(backupJob)
}

function mockVms(vms: FrontXoVm[]) {
  getVmById.mockImplementation((id: FrontXoVm['id']) => vms.find(vm => vm.id === id))
}

function mountTable(backupLog: FrontXoBackupLog) {
  return mount(BackupLogsTable, {
    props: { backupLogs: [backupLog], busy: false, error: false },
    global: createGlobalTestConfig(),
  })
}

function findVmCell(wrapper: ReturnType<typeof mountTable>) {
  const headers = wrapper.findAll('thead th').map(header => header.text())

  return wrapper.findAll('tbody tr td')[headers.indexOf(t('vm'))]
}

describe('VM', () => {
  it('links the first VM to its dashboard, with the icon of its power state and the count of the other VMs', () => {
    mockVms([createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' })])

    const vmCell = findVmCell(
      mountTable(
        createBackupLog({
          tasks: [createBackupLogVmTask('vm-1'), createBackupLogVmTask('vm-2'), createBackupLogVmTask('vm-3')],
        })
      )
    )
    const vmLink = vmCell.getComponent(UiLink)

    expect(vmLink.text()).toBe('Alpha VM')
    expect(vmLink.attributes('href')).toBe('/vm/vm-1/dashboard')
    expect(vmLink.props('icon')).toBe(objectIcon('vm', 'running'))
    expect(vmCell.get('.extra-count').text()).toBe('+2')
  })

  it('shows a VM not found for an unknown VM', () => {
    const vmCell = findVmCell(mountTable(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })))

    expect(vmCell.text()).toBe(t('vm-not-found'))
    expect(vmCell.find('a').exists()).toBe(false)
  })

  it('shows a VM not found for a log of a VM backup without VM', () => {
    const vmCell = findVmCell(mountTable(createBackupLog({ tasks: [] })))

    expect(vmCell.text()).toBe(t('vm-not-found'))
  })

  it('leaves the VM empty for a log of a job without VM', () => {
    mockBackupJob({ name: 'QA metadata', type: 'metadataBackup' })

    const vmCell = findVmCell(mountTable(createBackupLog({ tasks: [] })))

    expect(vmCell.text()).toBe('')
  })
})
