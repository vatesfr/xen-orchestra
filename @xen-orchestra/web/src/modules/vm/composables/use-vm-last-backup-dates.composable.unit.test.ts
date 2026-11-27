import { useVmLastBackupDates } from '@/modules/vm/composables/use-vm-last-backup-dates.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBackupLog, createBackupLogSrTask, createBackupLogVmTask } from '@/test/create-backup-log.ts'
import { HOLD_LOADING } from '@/test/hold-loading.ts'
import { backupLogCollectionMock, mockXoBackupLogCollection } from '@/test/mock-xo-backup-log-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'

mockXoBackupLogCollection()

beforeEach(() => {
  backupLogCollectionMock.reset()
})

const VM_ID = 'vm-1' as FrontXoVm['id']

function createVmTask(vmId: string, start: number, status: 'success' | 'failure' = 'success') {
  return { ...createBackupLogVmTask(vmId), start, status }
}

function mountLastBackupDates() {
  return mountComposable(() => useVmLastBackupDates()).wrapper.vm
}

describe('getVmLastBackupDate', () => {
  it('gives the start of the last successful backup of the VM', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ tasks: [createVmTask(VM_ID, 1000)] }),
      createBackupLog({ tasks: [createVmTask(VM_ID, 3000), createVmTask('vm-2', 5000)] }),
    ]

    expect(mountLastBackupDates().getVmLastBackupDate(VM_ID)).toBe(3000)
  })

  it('ignores the failed backups', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ tasks: [createVmTask(VM_ID, 1000), createVmTask(VM_ID, 3000, 'failure')] }),
    ]

    expect(mountLastBackupDates().getVmLastBackupDate(VM_ID)).toBe(1000)
  })

  it('ignores the tasks of other objects than VMs', () => {
    backupLogCollectionMock.backupLogs.value = [
      createBackupLog({ tasks: [{ ...createBackupLogSrTask(VM_ID), start: 1000 }] }),
    ]

    expect(mountLastBackupDates().getVmLastBackupDate(VM_ID)).toBeUndefined()
  })

  it('has no date for a VM never backed up', () => {
    backupLogCollectionMock.backupLogs.value = [createBackupLog({ tasks: undefined })]

    expect(mountLastBackupDates().getVmLastBackupDate(VM_ID)).toBeUndefined()
  })
})

describe('areBackupLogsReady', () => {
  it('waits for the backup logs', () => {
    HOLD_LOADING.backupLogs()

    expect(mountLastBackupDates().areBackupLogsReady).toBe(false)
  })
})
