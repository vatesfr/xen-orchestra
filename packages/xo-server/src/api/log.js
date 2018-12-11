export function get({ namespace }) {
  return this.getLogs(namespace)
}

get.description = 'returns logs list for one namespace'
get.params = {
  namespace: { type: 'string' },
}
get.permission = 'admin'

// -------------------------------------------------------------------

async function delete_({ namespace, id }) {
  const logger = await this.getLogger(namespace)
  logger.del(id)
}

delete_.description = 'deletes one or several logs from a namespace'
delete_.params = {
  id: { type: ['array', 'string'] },
  namespace: { type: 'string' },
}
delete_.permission = 'admin'

export { delete_ as delete }
