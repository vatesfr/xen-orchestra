import { DatastoreSoapEsxi } from './DatastoreSoapEsxi.mjs'
import { DatastoreXoRemote } from './DatastoreXoRemote.mjs'

export function openDatastore(dataStoreName, { esxi, dataStoreToHandlers = {}, ...otherOptions }) {
  const handler = dataStoreToHandlers[dataStoreName]
  if (handler === undefined) {
    return new DatastoreSoapEsxi(dataStoreName, { esxi, ...otherOptions })
  }
  return new DatastoreXoRemote(dataStoreName, { handler, ...otherOptions })
}
