import type {
  V2vRememberedConnection,
  V2vRememberedConnectionDetails,
  V2vRememberedConnectionKey,
  V2vRememberedConnectionsStorage,
} from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { getV2vAddress, V2V_DEFAULT_PORT } from '@/modules/v2v/utils/v2v-source.util.ts'
import { V2V_PLATFORM, type XoV2vConnection } from '@vates/types'
import { isPlainObject, omit } from 'lodash-es'

const PLATFORMS: unknown[] = Object.values(V2V_PLATFORM)

const OPTIONAL_STRING_FIELDS = ['password', 'product', 'version', 'sourceId'] as const

const OPTIONAL_NUMBER_FIELDS = ['vmCount', 'lastUsedAt'] as const

export function createEmptyRememberedConnectionsStorage(): V2vRememberedConnectionsStorage {
  return { version: 1, xo5Imported: false, connections: [] }
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isOptionalNumber(value: unknown) {
  return value === undefined || typeof value === 'number'
}

function isRememberedConnection(value: unknown): value is V2vRememberedConnection {
  if (!isPlainObject(value)) {
    return false
  }

  const entry = value as Record<string, unknown>

  const hasRequiredFields =
    PLATFORMS.includes(entry.platform) &&
    typeof entry.host === 'string' &&
    typeof entry.port === 'number' &&
    typeof entry.username === 'string' &&
    typeof entry.skipSslCheck === 'boolean'

  return (
    hasRequiredFields &&
    OPTIONAL_STRING_FIELDS.every(field => isOptionalString(entry[field])) &&
    OPTIONAL_NUMBER_FIELDS.every(field => isOptionalNumber(entry[field]))
  )
}

function hasKey(connection: V2vRememberedConnection, key: V2vRememberedConnectionKey) {
  return getRememberedConnectionKey(connection) === key
}

export function getRememberedConnectionKey(
  connection: Pick<XoV2vConnection, 'host' | 'port' | 'username'>
): V2vRememberedConnectionKey {
  return `${getV2vAddress(connection)}:${connection.username}`
}

export function findRememberedConnection(
  connections: V2vRememberedConnection[],
  key: V2vRememberedConnectionKey
): V2vRememberedConnection | undefined {
  return connections.find(connection => hasKey(connection, key))
}

export function parseRememberedConnectionsStorage(raw: unknown): V2vRememberedConnectionsStorage {
  const isKnownStorage = isPlainObject(raw) && (raw as Record<string, unknown>).version === 1

  if (!isKnownStorage) {
    return createEmptyRememberedConnectionsStorage()
  }

  const { xo5Imported, connections } = raw as Record<string, unknown>

  return {
    version: 1,
    xo5Imported: xo5Imported === true,
    connections: Array.isArray(connections) ? connections.filter(isRememberedConnection) : [],
  }
}

export function createRememberedConnection(
  connection: XoV2vConnection,
  details: V2vRememberedConnectionDetails,
  { withPassword }: { withPassword: boolean }
): V2vRememberedConnection {
  return {
    ...(withPassword ? connection : omit(connection, 'password')),
    ...details,
    platform: V2V_PLATFORM.VMWARE,
  }
}

export function upsertRememberedConnection(
  connections: V2vRememberedConnection[],
  connection: V2vRememberedConnection
): V2vRememberedConnection[] {
  const key = getRememberedConnectionKey(connection)

  const isAlreadyRemembered = findRememberedConnection(connections, key) !== undefined

  if (!isAlreadyRemembered) {
    return [...connections, connection]
  }

  return connections.map(existing => (hasKey(existing, key) ? connection : existing))
}

export function forgetRememberedConnection(
  connections: V2vRememberedConnection[],
  key: V2vRememberedConnectionKey
): V2vRememberedConnection[] {
  return connections.filter(connection => !hasKey(connection, key))
}

export function forgetRememberedPassword(
  connections: V2vRememberedConnection[],
  key: V2vRememberedConnectionKey
): V2vRememberedConnection[] {
  return connections.map(connection => (hasKey(connection, key) ? omit(connection, 'password') : connection))
}

// `createDateSorter` cannot be reused: a connection never used has no date and must come last
export function sortRememberedConnectionsByLastUse(connections: V2vRememberedConnection[]): V2vRememberedConnection[] {
  return [...connections].sort(
    (connection1, connection2) => (connection2.lastUsedAt ?? 0) - (connection1.lastUsedAt ?? 0)
  )
}

// XO 5 stored a single connection with an optional port in its host, without the SSL choice (on by default there)
export function fromXo5RememberedConnection(stored: {
  host: string | null
  user: string | null
  password: string | null
}): V2vRememberedConnection | undefined {
  if (!stored.host || !stored.user) {
    return undefined
  }

  const [, host = stored.host, port] = /^([^:]+):(\d+)$/.exec(stored.host) ?? []

  return {
    platform: V2V_PLATFORM.VMWARE,
    host,
    port: port === undefined ? V2V_DEFAULT_PORT : Number(port),
    username: stored.user,
    ...(stored.password ? { password: stored.password } : {}),
    skipSslCheck: true,
  }
}

export function toV2vConnection(
  connection: V2vRememberedConnection,
  password = connection.password
): XoV2vConnection | undefined {
  if (!password) {
    return undefined
  }

  return {
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password,
    skipSslCheck: connection.skipSslCheck,
  }
}
