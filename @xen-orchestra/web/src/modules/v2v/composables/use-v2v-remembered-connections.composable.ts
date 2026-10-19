import type {
  V2vRememberedConnection,
  V2vRememberedConnectionKey,
  V2vRememberedConnectionsStorage,
} from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import {
  createEmptyRememberedConnectionsStorage,
  forgetRememberedConnection,
  forgetRememberedPassword,
  fromXo5RememberedConnection,
  parseRememberedConnectionsStorage,
  sortRememberedConnectionsByLastUse,
  upsertRememberedConnection,
} from '@/modules/v2v/utils/v2v-remembered-connection.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export const V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY = 'v2v:remembered-connections'

const XO5_STORAGE_KEYS = { host: 'esxi_host', user: 'esxi_user', password: 'esxi_password' } as const

function parseStoredValue(raw: string | null) {
  try {
    return parseRememberedConnectionsStorage(raw === null ? undefined : JSON.parse(raw))
  } catch {
    return createEmptyRememberedConnectionsStorage()
  }
}

// XO 5 remembered one connection: offer it once, a later "forget" must not bring it back.
// Written before `useLocalStorage` reads the key: a write during its setup pauses its own persistence until the next tick.
function importXo5Connection() {
  try {
    const stored = parseStoredValue(localStorage.getItem(V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY))

    if (stored.xo5Imported) {
      return
    }

    const xo5Connection = fromXo5RememberedConnection({
      host: localStorage.getItem(XO5_STORAGE_KEYS.host),
      user: localStorage.getItem(XO5_STORAGE_KEYS.user),
      password: localStorage.getItem(XO5_STORAGE_KEYS.password),
    })

    const connections =
      xo5Connection === undefined ? stored.connections : upsertRememberedConnection(stored.connections, xo5Connection)

    localStorage.setItem(
      V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY,
      JSON.stringify({ ...stored, xo5Imported: true, connections })
    )
  } catch (error) {
    console.error('Failed to import the XO 5 remembered connection', error)
  }
}

// Remembered connections hold credentials: they stay in this browser and are only sent inside a request needing them
export function useV2vRememberedConnections() {
  importXo5Connection()

  const storage = useLocalStorage<V2vRememberedConnectionsStorage>(
    V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY,
    createEmptyRememberedConnectionsStorage(),
    {
      serializer: { read: parseStoredValue, write: value => JSON.stringify(value) },
      onError: error => console.error('Failed to access the remembered V2V connections', error),
    }
  )

  function updateConnections(update: (connections: V2vRememberedConnection[]) => V2vRememberedConnection[]) {
    storage.value = { ...storage.value, connections: update(storage.value.connections) }
  }

  const connections = computed(() => sortRememberedConnectionsByLastUse(storage.value.connections))

  function remember(connection: V2vRememberedConnection) {
    updateConnections(current => upsertRememberedConnection(current, connection))
  }

  function forget(key: V2vRememberedConnectionKey) {
    updateConnections(current => forgetRememberedConnection(current, key))
  }

  function forgetPassword(key: V2vRememberedConnectionKey) {
    updateConnections(current => forgetRememberedPassword(current, key))
  }

  return { connections, remember, forget, forgetPassword }
}
