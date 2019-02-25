import { cancelable } from 'promise-toolbox'

export default {
  @cancelable
  exportPoolMetadata($cancelToken) {
    const { pool } = this
    return this.getResource($cancelToken, '/pool/xmldbdump', {
      task: this.createTask(
        'Pool metadata',
        pool.name_label ?? pool.$master.name_label
      ),
    })
  },
}
