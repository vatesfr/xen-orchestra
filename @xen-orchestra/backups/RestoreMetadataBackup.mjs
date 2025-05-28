import { join, resolve } from 'node:path/posix'

import { DIR_XO_POOL_METADATA_BACKUPS } from './RemoteAdapter.mjs'
import { PATH_DB_DUMP } from './_runners/_PoolMetadataBackup.mjs'

export class RestoreMetadataBackup {
  constructor({ backupId, handler, xapi }) {
    this._backupId = backupId
    this._handler = handler
    this._xapi = xapi
  }

  async run() {
    const backupId = this._backupId
    const handler = this._handler
    const xapi = this._xapi

    if (backupId.split('/')[0] === DIR_XO_POOL_METADATA_BACKUPS) {
      return xapi.putResource(await handler.createReadStream(`${backupId}/data`), PATH_DB_DUMP, {
        task: xapi.task_create('Import pool metadata'),
      })
    } else {
      const metadata = JSON.parse(await handler.readFile(join(backupId, 'metadata.json')))
      const dataFileName = resolve('/', backupId, metadata.data ?? 'data.json').slice(1)
      const data = await handler.readFile(dataFileName)

      // if data is JSON, sent it as a plain string; otherwise, consider the data as binary and encode it
      const isJson = dataFileName.endsWith('.json')
      return isJson ? data.toString() : { encoding: 'base64', data: data.toString('base64') }
    }
  }
}
