export async function cancel({ task }) {
  await this.getXapi(task).call('task.cancel', task._xapiRef)
}

cancel.params = {
  id: { type: 'string' },
}

cancel.resolve = {
  task: ['id', 'task', 'administrate'],
}

// -------------------------------------------------------------------

export async function destroy({ task }) {
  await this.getXapi(task).call('task.destroy', task._xapiRef)
}

destroy.params = {
  id: { type: 'string' },
}

destroy.resolve = {
  task: ['id', 'task', 'administrate'],
}
