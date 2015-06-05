export async function cancel ({task}) {
  await this.getXAPI(task).call('task.cancel', task.ref)
}

cancel.params = {
  id: { type: 'string' }
}

cancel.resolve = {
  task: ['id', 'task', 'administrate']
}

// -------------------------------------------------------------------

export async function destroy ({task}) {
  await this.getXAPI(task).call('task.destroy', task.ref)
}

destroy.params = {
  id: { type: 'string' }
}

destroy.resolve = {
  task: ['id', 'task', 'administrate']
}
