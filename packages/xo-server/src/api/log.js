export async function get ({ namespace }) {
  const logger = await this.getLogger(namespace)

  return new Promise((resolve, reject) => {
    const logs = {}

    logger
      .createReadStream()
      .on('data', data => {
        logs[data.key] = data.value
      })
      .on('end', () => {
        resolve(logs)
      })
      .on('error', reject)
  })
}

get.description = 'returns logs list for one namespace'
get.params = {
  namespace: { type: 'string' },
}
get.permission = 'admin'

// -------------------------------------------------------------------

async function delete_ ({ namespace, id }) {
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
