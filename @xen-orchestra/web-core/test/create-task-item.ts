import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

/**
 * Builds a core Task (as displayed by the task lists) for use in tests. Pass
 * overrides to tweak only the fields relevant to the case under test.
 */
export function createTaskItem(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Task',
    status: 'pending',
    start: 0,
    ...overrides,
  }
}
