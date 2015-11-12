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
