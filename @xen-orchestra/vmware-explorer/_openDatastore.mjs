import { DatastoreSoapEsxi } from './DatastoreSoapEsxi.mjs'
import { DatastoreXoRemote } from './DatastoreXoRemote.mjs'

export function openDatastore(dataStoreName, { esxi, remotes = {}, ...otherOptions }) {
  const handler = remotes[dataStoreName]
  if (handler === undefined) {
    return new DatastoreSoapEsxi(dataStoreName, { esxi, ...otherOptions })
  }
  return new DatastoreXoRemote(dataStoreName, { handler, ...otherOptions })
}
