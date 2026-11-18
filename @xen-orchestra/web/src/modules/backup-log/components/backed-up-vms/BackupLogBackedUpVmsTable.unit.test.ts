import BackupLogBackedUpVmsTable from '@/modules/backup-log/components/backed-up-vms/BackupLogBackedUpVmsTable.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLog, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { mount } from '@vue/test-utils'

const { vmsById, vbdsById, vdisById } = vi.hoisted(() => ({
  vmsById: new Map<string, FrontXoVm>(),
  vbdsById: new Map<string, FrontXoVbd>(),
  vdisById: new Map<string, FrontXoVdi>(),
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    getVmById: (id: string) => vmsById.get(id),
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({
    getVbdsByIds: (ids: string[]) => ids.flatMap(id => vbdsById.get(id) ?? []),
  })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({
    getVdiById: (id: string) => vdisById.get(id),
  })) as unknown as typeof useXoVdiCollection,
}))

beforeEach(() => {
  vmsById.clear()
  vbdsById.clear()
  vdisById.clear()
})

function mockVmWithDisks(disks: { vbd: Partial<FrontXoVbd>; vdi: Partial<FrontXoVdi> & Pick<FrontXoVdi, 'id'> }[]) {
  const vbds = disks.map(({ vbd, vdi }, index) =>
    createVbd({ id: `vbd-${index}` as FrontXoVbd['id'], VDI: vdi.id, ...vbd })
  )

  vbds.forEach(vbd => vbdsById.set(vbd.id, vbd))
  disks.forEach(({ vdi }) => vdisById.set(vdi.id, createVdi(vdi)))

  vmsById.set('vm-1', createVm({ id: 'vm-1' as FrontXoVm['id'], $VBDs: vbds.map(vbd => vbd.id) }))
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
