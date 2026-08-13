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

export const allTasks: Task[] = [
  pendingBackupTask,
  completedWithRootLinkTask,
  failedWithWarningsTask,
  migrationNamePartsTask,
  deepNestedTask,
]
