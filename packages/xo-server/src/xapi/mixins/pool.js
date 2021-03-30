import { cancelable } from 'promise-toolbox'

const PATH_DB_DUMP = '/pool/xmldbdump'

export default {
  @cancelable
  exportPoolMetadata($cancelToken) {
    return this.getResource($cancelToken, PATH_DB_DUMP, {
      task: this.task_create('Export pool metadata'),
    })
  },

  // Restore the XAPI database from an XML backup
  //
  // See https://github.com/xapi-project/xen-api/blob/405b02e72f1ccc4f4b456fd52db30876faddcdd8/ocaml/xapi/pool_db_backup.ml#L170-L205
  @cancelable
  importPoolMetadata($cancelToken, stream, force = false) {
    return this.putResource($cancelToken, stream, PATH_DB_DUMP, {
      query: {
        dry_run: String(!force),
      },
      task: this.task_create('Import pool metadata'),
    })
  },
}
