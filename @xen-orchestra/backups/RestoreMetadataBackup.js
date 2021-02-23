const { DIR_XO_POOL_METADATA_BACKUPS } = require('./RemoteAdapter')
const { PATH_DB_DUMP } = require('./_PoolMetadataBackup')

exports.RestoreMetadataBackup = class RestoreMetadataBackup {
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
        task: xapi.createTask('Import pool metadata'),
      })
    } else {
      return JSON.parse(String(await handler.readFile(`${backupId}/data.json`)))
    }
  }
}
