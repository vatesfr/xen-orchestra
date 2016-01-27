export async function get ({namespace}) {
  const logger = this.getLogger(namespace)

  return new Promise((resolve, reject) => {
    const logs = {}

    logger.createReadStream()
      .on('data', (data) => {
        logs[data.key] = data.value
      })
      .on('end', () => {
        resolve(logs)
      })
      .on('error', reject)
  })
}

get.description = 'returns logs list for one namespace'

function delete_ ({namespace, id}) {
  const logger = this.getLogger(namespace)
  logger.del(id)
}

delete_.description = 'deletes on or several logs from a namespace'
delete_.permission = 'admin'

export {delete_ as delete}
