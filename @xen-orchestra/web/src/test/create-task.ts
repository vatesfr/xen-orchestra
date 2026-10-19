import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { NOW } from '@/test/now.ts'

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
