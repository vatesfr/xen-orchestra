import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { isEqual } from 'lodash-es'

// Keeps the previous object of each task that did not change, subtasks included, so the components it is passed to
// can skip their update. Returns the previous list itself when no task changed
export function reuseUnchangedTasks(previousTasks: Task[] | undefined, nextTasks: Task[]): Task[] {
  if (previousTasks === undefined) {
    return nextTasks
  }

  const previousTasksById = new Map(previousTasks.map(task => [task.id, task]))

  const tasks = nextTasks.map(task => reuseUnchangedTask(previousTasksById.get(task.id), task))

  if (hasSameTasks(tasks, previousTasks)) {
    return previousTasks
  }

  return hasSameTasks(tasks, nextTasks) ? nextTasks : tasks
}

function hasSameTasks(tasks: Task[], otherTasks: Task[]) {
  return tasks.length === otherTasks.length && tasks.every((task, index) => task === otherTasks[index])
}

// A changed task keeps its new object, which reuses its unchanged subtasks
function reuseUnchangedTask(previousTask: Task | undefined, nextTask: Task): Task {
  if (previousTask === undefined) {
    return nextTask
  }

  const { subtasks: previousSubtasks, ...previousFields } = previousTask
  const { subtasks: nextSubtasks, ...nextFields } = nextTask

  const subtasks = nextSubtasks === undefined ? undefined : reuseUnchangedTasks(previousSubtasks, nextSubtasks)

  if (subtasks === previousSubtasks && isEqual(previousFields, nextFields)) {
    return previousTask
  }

  return subtasks === nextSubtasks ? nextTask : { ...nextTask, subtasks }
}
