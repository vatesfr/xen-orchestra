import BackupLogBackedUpVmsTable from '@/modules/backup-log/components/backed-up-vms/BackupLogBackedUpVmsTable.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLog, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { seedVmDisks } from '@/test/seed-vm-disks.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { mount } from '@vue/test-utils'

mockXoVmCollection()

mockXoVmDeviceCollections('vbd', 'vdi')

beforeEach(() => {
  vmCollectionMock.reset()
  vmDeviceCollectionsMock.reset()
})

function mockVmWithDisks(disks: { vbd: Partial<FrontXoVbd>; vdi: Partial<FrontXoVdi> & Pick<FrontXoVdi, 'id'> }[]) {
  vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], $VBDs: seedVmDisks(disks) })]
}

function findVirtualSizeCell(backupLog: FrontXoBackupLog) {
  const wrapper = mount(BackupLogBackedUpVmsTable, {
    props: { backupLog },
    global: createGlobalTestConfig(),
  })

  const headers = wrapper.findAll('thead th').map(header => header.text())

  return wrapper.findAll('tbody tr td')[headers.indexOf(t('virtual-size'))]
}

describe('virtual size', () => {
  it('sums the size of the VM disks', () => {
    mockVmWithDisks([
      { vbd: {}, vdi: { id: 'vdi-1' as FrontXoVdi['id'], size: 1_073_741_824 } },
      { vbd: {}, vdi: { id: 'vdi-2' as FrontXoVdi['id'], size: 1_073_741_824 } },
    ])

    const { value, prefix } = formatSizeRaw(2_147_483_648, 2)

    const cellText = findVirtualSizeCell(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })).text()

    expect(cellText).toContain(String(value))
    expect(cellText).toContain(prefix)
  })

  it('ignores the CD drives', () => {
    mockVmWithDisks([
      { vbd: {}, vdi: { id: 'vdi-1' as FrontXoVdi['id'], size: 1_073_741_824 } },
      { vbd: { is_cd_drive: true }, vdi: { id: 'vdi-2' as FrontXoVdi['id'], size: 5_368_709_120 } },
    ])

    const { value, prefix } = formatSizeRaw(1_073_741_824, 2)

    const cellText = findVirtualSizeCell(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })).text()

    expect(cellText).toContain(String(value))
    expect(cellText).toContain(prefix)
  })

  it('leaves the virtual size empty for a VM that no longer exists', () => {
    expect(findVirtualSizeCell(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] })).text()).toBe('')
  })
})
