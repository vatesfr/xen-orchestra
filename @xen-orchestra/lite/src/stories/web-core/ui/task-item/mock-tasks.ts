import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export const pendingBackupTask: Task = {
  id: '1',
  name: 'VM backup',
  status: 'pending',
  progress: 45,
  subtasks: [
    { id: '1-1', name: 'Snapshot', status: 'success', progress: 100, end: Date.now() - 3 * 60_000 },
    { id: '1-2', name: 'Export', status: 'pending', progress: 10 },
  ],
}

export const completedWithRootLinkTask: Task = {
  id: '2',
  name: 'Pool metadata sync',
  to: '#',
  status: 'success',
  progress: 100,
  end: Date.now() - 15 * 60_000,
}

export const failedWithWarningsTask: Task = {
  id: '3',
  name: 'VM migration',
  status: 'failure',
  progress: 100,
  warnings: [{ message: 'Partial export failure', data: { file: 'backup.log' } }],
}

export const migrationNamePartsTask: Task = {
  id: '4',
  status: 'pending',
  progress: 30,
  nameParts: [
    { text: 'Migrating VM ' },
    { text: 'Production', to: { name: '/vm/[uuid]/dashboard', params: { uuid: 'vm-1' } } },
    { text: ' from ' },
    { text: 'Host-1', to: { name: '/host/[uuid]/dashboard', params: { uuid: 'host-1' } } },
    { text: ' to ' },
    { text: 'Host-2', to: { name: '/host/[uuid]/dashboard', params: { uuid: 'host-2' } } },
  ],
}

export const deepNestedTask: Task = {
  id: '5',
  name: 'VM backup',
  status: 'pending',
  progress: 60,
  subtasks: [
    {
      id: '5-1',
      name: 'Export',
      status: 'pending',
      progress: 20,
      subtasks: [
        { id: '5-1-1', name: 'VDI export', status: 'pending', progress: 5 },
        {
          id: '5-1-2',
          name: 'Metadata export',
          status: 'success',
          progress: 100,
          end: Date.now() - 60_000,
        },
      ],
    },
  ],
}

// No progress set: displayed as 0% while pending
export const pendingWithoutProgressTask: Task = {
  id: '6',
  name: 'Queued replication',
  status: 'pending',
  start: Date.now() - 2 * 60_000,
}

// Progress at 100% but not ended yet
export const pendingFullProgressTask: Task = {
  id: '7',
  name: 'Finalize export',
  status: 'pending',
  progress: 100,
  start: Date.now() - 60_000,
  infos: [{ message: 'Waiting for cleanup', data: null }],
}

export const infosAndWarningsTask: Task = {
  id: '8',
  name: 'Rolling pool update',
  status: 'pending',
  progress: 50,
  start: Date.now() - 3 * 60 * 60_000,
  infos: [{ message: 'Hosts updated', data: { hosts: 4, done: 2 } }],
  warnings: [{ message: 'Reboot required after update', data: { host: 'host-3' } }],
  subtasks: [
    { id: '8-1', name: 'host-1', status: 'success', progress: 100, end: Date.now() - 2 * 60 * 60_000 },
    { id: '8-2', name: 'host-2', status: 'success', progress: 100, end: Date.now() - 60 * 60_000 },
    { id: '8-3', name: 'host-3', status: 'pending', progress: 30, start: Date.now() - 15 * 60_000 },
  ],
}

// Failure propagated from a nested subtask
export const failedNestedTask: Task = {
  id: '9',
  name: 'Disaster recovery drill',
  status: 'failure',
  progress: 100,
  start: Date.now() - 8 * 60 * 60_000,
  end: Date.now() - 7 * 60 * 60_000,
  subtasks: [
    { id: '9-1', name: 'Provision VM', status: 'success', progress: 100, end: Date.now() - 7.5 * 60 * 60_000 },
    {
      id: '9-2',
      name: 'Restore data',
      status: 'failure',
      progress: 100,
      end: Date.now() - 7 * 60 * 60_000,
      warnings: [{ message: 'Missing backup files', data: { missing: 3 } }],
      subtasks: [
        { id: '9-2-1', name: 'Mount SR', status: 'failure', progress: 100, end: Date.now() - 7.1 * 60 * 60_000 },
      ],
    },
  ],
}

export const interruptedTask: Task = {
  id: '10',
  name: 'Storage migration',
  status: 'interrupted',
  progress: 10,
  start: Date.now() - 2 * 60 * 60_000,
  infos: [
    { message: 'Rows migrated before interruption', data: { rows: 1200 } },
    { message: 'Task manually aborted', data: null },
  ],
}

export const longNameTask: Task = {
  id: '11',
  name: 'Very long task name that should wrap gracefully in the task list UI when space is limited',
  status: 'pending',
  progress: 8,
  start: Date.now() - 2 * 60 * 60_000,
}

// Long name combined with every optional display: link, counter, infos, warnings, error, end time
export const longNameWithEverythingTask: Task = {
  id: '12',
  name: 'Very long task name for a full backup job that also has subtasks, infos, warnings and an end time to display',
  to: '#',
  status: 'failure',
  progress: 100,
  start: Date.now() - 5 * 60 * 60_000,
  end: Date.now() - 4 * 60 * 60_000,
  infos: [{ message: 'Transferred 120 GiB', data: { size: 120 } }],
  warnings: [{ message: 'Some VDIs were skipped', data: { skipped: 2 } }],
  subtasks: [
    { id: '12-1', name: 'Snapshot', status: 'success', progress: 100, end: Date.now() - 4.5 * 60 * 60_000 },
    { id: '12-2', name: 'Transfer', status: 'failure', progress: 100, end: Date.now() - 4 * 60 * 60_000 },
  ],
}

export const allTasks: Task[] = [
  pendingBackupTask,
  completedWithRootLinkTask,
  failedWithWarningsTask,
  migrationNamePartsTask,
  deepNestedTask,
  pendingWithoutProgressTask,
  pendingFullProgressTask,
  infosAndWarningsTask,
  failedNestedTask,
  interruptedTask,
  longNameTask,
  longNameWithEverythingTask,
]
