import { V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY } from '@/modules/v2v/composables/use-v2v-remembered-connections.composable.ts'
import type {
  V2vRememberedConnection,
  V2vRememberedConnectionsStorage,
} from '@/modules/v2v/types/v2v-remembered-connection.type.ts'

// `xo5Imported` defaults to true so a test never gets the XO 5 connection imported behind its back
export function createV2vRememberedConnectionsStorage(
  connections: V2vRememberedConnection[] = [],
  xo5Imported = true
): V2vRememberedConnectionsStorage {
  return { version: 1, xo5Imported, connections }
}

export function serializeV2vRememberedConnections(connections: V2vRememberedConnection[], xo5Imported = true) {
  return JSON.stringify(createV2vRememberedConnectionsStorage(connections, xo5Imported))
}

export function seedV2vRememberedConnections(connections: V2vRememberedConnection[], xo5Imported = true) {
  localStorage.setItem(
    V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY,
    serializeV2vRememberedConnections(connections, xo5Imported)
  )
}

export function readV2vRememberedConnectionsStorage() {
  return JSON.parse(localStorage.getItem(V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY) ?? 'null')
}
