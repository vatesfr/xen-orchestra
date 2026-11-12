import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { NOW } from '@/test/now.ts'
import { V2V_TASK_PROPERTY } from '@vates/types'

// A task still running: no `end` nor `result` yet
export function createTask(overrides: Partial<FrontXoTask> = {}): FrontXoTask {
  return {
    id: 'task-123' as FrontXoTask['id'],
    start: NOW,
    status: 'pending',
    progress: 0,
    properties: { name: 'Test task' },
    infos: [],
    warnings: [],
    tasks: [],
    ...overrides,
  }
}

// Task properties are untyped: `sourceVmIds` takes anything, to build the malformed ones too
export function createV2vImportTask(sourceVmIds: unknown, status: FrontXoTask['status'] = 'pending'): FrontXoTask {
  return createTask({ status, properties: { [V2V_TASK_PROPERTY.SOURCE_VM_IDS]: sourceVmIds } })
}
