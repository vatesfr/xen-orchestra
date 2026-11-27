import type { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import BackupLogsTable from '@/modules/backup-log/components/list/BackupLogsTable.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLog, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { findLink, findLinks } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

const getBackupJobById = vi.fn()

mockXoRoutes()

mockModule(import('@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'), () => ({
  useXoBackupJobCollection: (() => ({ getBackupJobById })) as unknown as typeof useXoBackupJobCollection,
}))

mockXoVmCollection()

mockXoCollections('host', 'pbd', 'sr')

beforeEach(() => {
  getBackupJobById.mockReset()
  vmCollectionMock.reset()
  xoCollectionsMock.reset()

  mockBackupJob({ name: 'QA delta', type: 'backup' })
})

function mockBackupJob(backupJob: { name: string; type: string } | undefined) {
  getBackupJobById.mockReturnValue(backupJob)
}

function mountTable(backupLog: FrontXoBackupLog) {
  return mount(BackupLogsTable, {
    props: { backupLogs: [backupLog], busy: false, error: false },
    global: createGlobalTestConfig(),
  })
}

function findVmCell(wrapper: ReturnType<typeof mountTable>) {
  return findTableColumnCells(wrapper, t('vm'))[0]
}

describe('VM', () => {
  it('links the first VM to its dashboard, with the icon of its power state and the count of the other VMs', () => {
    vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' })]

    const vmCell = findVmCell(
      mountTable(
        createBackupLog({
          tasks: [createBackupLogVmTask('vm-1'), createBackupLogVmTask('vm-2'), createBackupLogVmTask('vm-3')],
        })
      )
    )

    expect(findLink(vmCell)).toEqual({
      text: 'Alpha VM',
      href: '/vm/vm-1/dashboard',
      icon: objectIcon('vm', 'running'),
    })
    expect(vmCell.get('.extra-count').text()).toBe('+2')
  })

  it.each([
    { label: 'an unknown VM', tasks: [createBackupLogVmTask('vm-1')] },
    { label: 'a log of a VM backup without VM', tasks: [] },
  ])('shows a VM not found, without link, for $label', ({ tasks }) => {
    const vmCell = findVmCell(mountTable(createBackupLog({ tasks })))

    expect(vmCell.text()).toBe(t('vm-not-found'))
    expect(findLinks(vmCell, 'a')).toEqual([])
  })

  it('leaves the VM empty for a log of a job without VM', () => {
    mockBackupJob({ name: 'QA metadata', type: 'metadataBackup' })

    const vmCell = findVmCell(mountTable(createBackupLog({ tasks: [] })))

    expect(vmCell.text()).toBe('')
  })
})
