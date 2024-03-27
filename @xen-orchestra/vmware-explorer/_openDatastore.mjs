import { DatastoreSoapEsxi } from './DatastoreSoapEsxi.mjs'
import { DatastoreXoRemote } from './DatastoreXoRemote.mjs'
import { createLogger } from '@xen-orchestra/log'

const { info } = createLogger('xo:vmware-explorer:openDatastore')

export function openDatastore(dataStoreName, { esxi, dataStoreToHandlers = {}, ...otherOptions }) {
  const handler = dataStoreToHandlers[dataStoreName]
  if (handler === undefined) {
    info(`use Soap api to read datastore ${dataStoreName}`, {
      dataStoreName,
      dataStoreToHandlers: Object.keys(dataStoreToHandlers),
    })
    return new DatastoreSoapEsxi(dataStoreName, { esxi, ...otherOptions })
  }
  info(`use Xo remote to read  datastore ${dataStoreName}`, {
    dataStoreName,
    dataStoreToHandlers: Object.keys(dataStoreToHandlers),
  })
  return new DatastoreXoRemote(dataStoreName, { handler, ...otherOptions })
}
