import { useBackupJobMirrorVms } from '@/modules/backup-job/composables/use-backup-job-mirror-vms.composable.ts'
import type { BackupJobMode } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type {
  FrontXoVmBackupArchive,
  useXoVmBackupArchiveCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { ref } from 'vue'

const { backupArchives, areBackupArchivesReady, getVmById } = vi.hoisted(() => ({
  backupArchives: { value: [] as unknown[] },
  areBackupArchivesReady: { value: true },
  getVmById: vi.fn(),
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
  useXoVmBackupArchiveCollection: (() => ({
    backupArchives: ref(backupArchives.value),
    areBackupArchivesReady: ref(areBackupArchivesReady.value),
  })) as unknown as typeof useXoVmBackupArchiveCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ getVmById })) as unknown as typeof useXoVmCollection,
}))

const BR_ID = 'br-1' as FrontXoBackupRepository['id']

const WEB_VM = createVm({ id: 'vm-web' as FrontXoVm['id'], name_label: 'Web server', tags: ['prod'] })
const DB_VM = createVm({ id: 'vm-db' as FrontXoVm['id'], name_label: 'Database', tags: [] })

function createArchive(vm: FrontXoVm, mode: BackupJobMode, timestamp: number) {
  return {
    id: `archive-${vm.id}-${timestamp}`,
    vm: { uuid: vm.id, name_label: vm.name_label, tags: vm.tags },
    mode,
    timestamp,
  } as unknown as FrontXoVmBackupArchive
}

beforeEach(() => {
  backupArchives.value = []
  areBackupArchivesReady.value = true
  getVmById.mockReset()
  getVmById.mockReturnValue(undefined)
})

function mountMirrorVms({
  backupRepositoryId = BR_ID,
  mode = 'delta',
}: {
  backupRepositoryId?: FrontXoBackupRepository['id'] | null
  mode?: BackupJobMode
} = {}) {
  return mountComposable(() => useBackupJobMirrorVms(backupRepositoryId ?? undefined, mode, true)).wrapper.vm
}

describe('mirrorVms', () => {
  it('lists each backed up VM once, with its backup count and its last backup date', () => {
    backupArchives.value = [createArchive(WEB_VM, 'delta', 1000), createArchive(WEB_VM, 'delta', 3000)]

    expect(mountMirrorVms().mirrorVms).toEqual([
      {
        id: WEB_VM.id,
        name_label: 'Web server',
        tags: ['prod'],
        powerState: undefined,
        backupCount: 2,
        lastBackupDate: 3000,
      },
    ])
  })

  it('keeps the backups of the mode of the job only', () => {
    backupArchives.value = [createArchive(WEB_VM, 'delta', 1000), createArchive(DB_VM, 'full', 2000)]

    expect(mountMirrorVms({ mode: 'full' }).mirrorVms.map(vm => vm.id)).toEqual([DB_VM.id])
  })

  it('gives the power state of a VM still existing', () => {
    backupArchives.value = [createArchive(WEB_VM, 'delta', 1000)]
    getVmById.mockReturnValue(createVm({ power_state: VM_POWER_STATE.HALTED }))

    expect(mountMirrorVms().mirrorVms[0].powerState).toBe(VM_POWER_STATE.HALTED)
  })
})

describe('areMirrorVmsReady', () => {
  it('is ready without source backup repository', () => {
    areBackupArchivesReady.value = false

    expect(mountMirrorVms({ backupRepositoryId: null }).areMirrorVmsReady).toBe(true)
  })

  it('waits for the backups of the source backup repository', () => {
    areBackupArchivesReady.value = false

    expect(mountMirrorVms().areMirrorVmsReady).toBe(false)
  })
})
