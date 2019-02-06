import { cancelable } from 'promise-toolbox'

import { parseXml } from '../../utils'

export default {
  @cancelable
  getPoolMetadata($cancelToken) {
    const { pool } = this
    return this.getResource($cancelToken, '/pool/xmldbdump', {
      task: this.createTask(
        'Pool metadata',
        pool.name_label ?? pool.$master.name_label
      ),
    })
      .then(response => response.readAll())
      .then(parseXml)
  },
}
