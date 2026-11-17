import { useXoBackupLogTaskName } from '@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLogTask, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { createBr } from '@/test/create-br.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { vmsById, srsById, brsById } = vi.hoisted(() => ({
  vmsById: new Map<string, FrontXoVm>(),
  srsById: new Map<string, FrontXoSr>(),
  brsById: new Map<string, FrontXoBackupRepository>(),
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    getVmById: (id: string) => vmsById.get(id),
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    getSrById: (id: string) => srsById.get(id),
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    getBackupRepositoryById: (id: string) => brsById.get(id),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

beforeEach(() => {
  vmsById.clear()
  srsById.clear()
  brsById.clear()
})

function mountTaskName() {
  return mountComposable(() => useXoBackupLogTaskName()).wrapper.vm
}

describe('getTaskName', () => {
  it('gives the name of the VM with a link to its dashboard', () => {
    vmsById.set('vm-1', createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'My VM' }))

    expect(mountTaskName().getTaskName(createBackupLogVmTask('vm-1'))).toEqual({
      name: 'My VM',
      to: { name: '/vm/[id]/dashboard', params: { id: 'vm-1' } },
    })
  })

  it('gives the VM name saved in the log, without a link, for a VM that no longer exists', () => {
    const task = createBackupLogTask({ data: { type: 'VM', id: 'vm-1', name_label: 'Deleted VM' } })

    expect(mountTaskName().getTaskName(task)).toEqual({ name: 'Deleted VM' })
  })

  it('gives the VM id, without a link, for an unknown VM without a saved name', () => {
    expect(mountTaskName().getTaskName(createBackupLogVmTask('vm-1'))).toEqual({ name: 'vm-1' })
  })

  it('gives the name of the SR with a link to its page', () => {
    srsById.set('sr-1', createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'My SR' }))

    const task = createBackupLogTask({ data: { type: 'SR', id: 'sr-1' } })

    expect(mountTaskName().getTaskName(task)).toEqual({
      name: 'My SR',
      to: { name: '/sr/[id]/general', params: { id: 'sr-1' } },
    })
  })

  it('gives the SR id, without a link, for an unknown SR', () => {
    const task = createBackupLogTask({ data: { type: 'SR', id: 'sr-1' } })

    expect(mountTaskName().getTaskName(task)).toEqual({ name: 'sr-1' })
  })

  it('gives the name of the backup repository with a link to its page', () => {
    brsById.set('br-1', createBr({ id: 'br-1' as FrontXoBackupRepository['id'], name: 'My BR' }))

    const task = createBackupLogTask({ data: { type: 'remote', id: 'br-1' } })

    expect(mountTaskName().getTaskName(task)).toEqual({
      name: 'My BR',
      to: { name: '/admin/backup-repository/[id]/general', params: { id: 'br-1' } },
    })
  })

  it('gives the backup repository id, without a link, for an unknown backup repository', () => {
    const task = createBackupLogTask({ data: { type: 'remote', id: 'br-1' } })

    expect(mountTaskName().getTaskName(task)).toEqual({ name: 'br-1' })
  })

  it.each([
    ['snapshot', 'snapshot'],
    ['transfer', 'transfer'],
    ['merge', 'merge'],
    ['health check', 'health-check'],
  ])('translates the "%s" step', (message, key) => {
    expect(mountTaskName().getTaskName(createBackupLogTask({ message }))).toEqual({ name: t(key) })
  })

  it('gives the message of any other step as is', () => {
    expect(mountTaskName().getTaskName(createBackupLogTask({ message: 'clean-vm' }))).toEqual({ name: 'clean-vm' })
  })
})
