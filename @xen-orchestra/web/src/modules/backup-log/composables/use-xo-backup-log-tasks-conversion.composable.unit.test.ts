import type { useXoBackupLogTaskName } from '@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'
import { useXoBackupLogTasksConversion } from '@/modules/backup-log/composables/use-xo-backup-log-tasks-conversion.composable.ts'
import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { createBackupLog, createBackupLogTask } from '@/test/create-backup-log.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

vi.mock(import('@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'), () => ({
  useXoBackupLogTaskName: (() => ({
    getTaskName: (task: BackupLogTask) => ({ name: `name of ${task.message}` }),
  })) as unknown as typeof useXoBackupLogTaskName,
}))

function mountTasksConversion(backupLog: MaybeRefOrGetter<FrontXoBackupLog>) {
  return mountComposable(() => useXoBackupLogTasksConversion(backupLog)).wrapper.vm
}

describe('useXoBackupLogTasksConversion', () => {
  it('converts every task of the log with its name, dates, infos and warnings', () => {
    const infos = [{ data: {}, message: 'an info' }]
    const warnings = [{ data: {}, message: 'a warning' }]

    const task = createBackupLogTask({
      id: 'task-1' as BackupLogTask['id'],
      message: 'backup VM',
      start: 1_000,
      end: 2_000,
      infos,
      warnings,
    })

    expect(mountTasksConversion(createBackupLog({ tasks: [task] })).convertedTasks).toEqual([
      {
        id: 'task-1',
        status: 'success',
        name: 'name of backup VM',
        progress: 0,
        start: 1_000,
        end: 2_000,
        infos,
        warnings,
        subtasks: undefined,
      },
    ])
  })

  it('converts the subtasks at every level', () => {
    const backupLog = createBackupLog({
      tasks: [
        createBackupLogTask({
          message: 'backup VM',
          tasks: [createBackupLogTask({ message: 'export', tasks: [createBackupLogTask({ message: 'transfer' })] })],
        }),
      ],
    })

    const [vmTask] = mountTasksConversion(backupLog).convertedTasks

    expect(vmTask.subtasks?.[0].name).toBe('name of export')
    expect(vmTask.subtasks?.[0].subtasks?.[0].name).toBe('name of transfer')
  })

  it('gives the progress the backup sets in the task data', () => {
    const data = { progress: 42 } as unknown as BackupLogTask['data']

    const backupLog = createBackupLog({
      tasks: [createBackupLogTask({ message: 'read disk', status: 'pending', data })],
    })

    expect(mountTasksConversion(backupLog).convertedTasks[0].progress).toBe(42)
  })

  it('shows an interrupted task as failed', () => {
    const backupLog = createBackupLog({ tasks: [createBackupLogTask({ status: 'interrupted' })] })

    expect(mountTasksConversion(backupLog).convertedTasks[0].status).toBe('failure')
  })

  it('gives no task for a log without tasks', () => {
    expect(mountTasksConversion(createBackupLog({ tasks: undefined })).convertedTasks).toEqual([])
  })

  it('follows the changes of the log', () => {
    const backupLog = ref(createBackupLog({ tasks: [] }))

    const result = mountTasksConversion(backupLog)

    backupLog.value = createBackupLog({ tasks: [createBackupLogTask({ message: 'backup VM' })] })

    expect(result.convertedTasks.map(task => task.name)).toEqual(['name of backup VM'])
  })
})
