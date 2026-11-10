import {
  useV2vRememberedConnections,
  V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY,
} from '@/modules/v2v/composables/use-v2v-remembered-connections.composable.ts'
import {
  fromXo5RememberedConnection,
  getRememberedConnectionKey,
} from '@/modules/v2v/utils/v2v-remembered-connection.util.ts'
import { V2V_DEFAULT_PORT } from '@/modules/v2v/utils/v2v-source.util.ts'
import {
  createOldAndRecentV2vRememberedConnections,
  createV2vRememberedConnection,
} from '@/test/create-v2v-connection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import {
  readV2vRememberedConnectionsStorage,
  seedV2vRememberedConnections,
  serializeV2vRememberedConnections,
} from '@/test/v2v-remembered-connections-storage.ts'
import { omit } from 'lodash-es'
import { nextTick } from 'vue'

const XO5_CONNECTION = { host: 'esxi.lab', user: 'root', password: 'secret' }

function seedXo5Connection() {
  localStorage.setItem('esxi_host', XO5_CONNECTION.host)
  localStorage.setItem('esxi_user', XO5_CONNECTION.user)
  localStorage.setItem('esxi_password', XO5_CONNECTION.password)
}

function mountRememberedConnections() {
  return mountComposable(() => useV2vRememberedConnections()).wrapper.vm
}

// The composable logs every storage failure: returns the silenced `console.error` to assert on it
function failStorageWrites() {
  const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new Error('Storage is full')
  })

  onTestFinished(() => setItem.mockRestore())

  return silenceConsoleError()
}

beforeEach(() => {
  localStorage.clear()
})

describe('connections', () => {
  it('lists the remembered connections, the most recently used first', () => {
    const { old, recent } = createOldAndRecentV2vRememberedConnections()
    seedV2vRememberedConnections([old, recent])

    expect(mountRememberedConnections().connections).toEqual([recent, old])
  })

  it('is empty when the storage is corrupted', () => {
    localStorage.setItem(V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY, '{not json')

    expect(mountRememberedConnections().connections).toEqual([])
  })

  it('follows the changes made in another tab', async () => {
    seedV2vRememberedConnections([])
    const result = mountRememberedConnections()
    const fromOtherTab = createV2vRememberedConnection({ host: 'other-tab.lab' })
    const newValue = serializeV2vRememberedConnections([fromOtherTab])

    localStorage.setItem(V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY, newValue)
    window.dispatchEvent(
      new StorageEvent('storage', { key: V2V_REMEMBERED_CONNECTIONS_STORAGE_KEY, newValue, storageArea: localStorage })
    )
    await nextTick()

    expect(result.connections).toEqual([fromOtherTab])
  })

  it('includes the XO 5 remembered connection once imported', () => {
    seedXo5Connection()

    expect(mountRememberedConnections().connections).toEqual([fromXo5RememberedConnection(XO5_CONNECTION)])
    expect(readV2vRememberedConnectionsStorage().xo5Imported).toBe(true)
  })

  it('does not import the XO 5 connection again once forgotten', async () => {
    seedXo5Connection()
    const first = mountRememberedConnections()

    first.forget(
      getRememberedConnectionKey({ host: XO5_CONNECTION.host, port: V2V_DEFAULT_PORT, username: XO5_CONNECTION.user })
    )
    await nextTick()

    expect(mountRememberedConnections().connections).toEqual([])
  })

  it('does not import the XO 5 connection when the import already happened', () => {
    seedXo5Connection()
    seedV2vRememberedConnections([], true)

    expect(mountRememberedConnections().connections).toEqual([])
  })

  it('stays usable when the XO 5 connection cannot be imported', () => {
    seedXo5Connection()
    const consoleError = failStorageWrites()

    expect(mountRememberedConnections().connections).toEqual([])
    expect(consoleError).toHaveBeenCalledWith('Failed to import the XO 5 remembered connection', expect.any(Error))
  })
})

describe('remember', () => {
  it('stores a new connection in the browser', async () => {
    seedV2vRememberedConnections([])
    const connection = createV2vRememberedConnection()

    mountRememberedConnections().remember(connection)
    await nextTick()

    expect(readV2vRememberedConnectionsStorage().connections).toEqual([connection])
  })

  it('replaces the connection with the same host, port and username', () => {
    seedV2vRememberedConnections([createV2vRememberedConnection({ vmCount: 1 })])
    const updated = createV2vRememberedConnection({ vmCount: 2 })

    const result = mountRememberedConnections()
    result.remember(updated)

    expect(result.connections).toEqual([updated])
  })

  it('keeps the connection for the page when the browser storage cannot be written', async () => {
    seedV2vRememberedConnections([])
    const result = mountRememberedConnections()
    const consoleError = failStorageWrites()
    const connection = createV2vRememberedConnection()

    result.remember(connection)
    await nextTick()

    expect(result.connections).toEqual([connection])
    expect(consoleError).toHaveBeenCalledWith('Failed to access the remembered V2V connections', expect.any(Error))
  })
})

describe('forgetPassword', () => {
  it('removes the password of the connection only', () => {
    const connection = createV2vRememberedConnection()
    seedV2vRememberedConnections([connection])

    const result = mountRememberedConnections()
    result.forgetPassword(getRememberedConnectionKey(connection))

    expect(result.connections).toEqual([omit(connection, 'password')])
  })
})

describe('forget', () => {
  it('removes the connection', () => {
    const forgotten = createV2vRememberedConnection({ host: 'forgotten.lab' })
    const kept = createV2vRememberedConnection({ host: 'kept.lab' })
    seedV2vRememberedConnections([forgotten, kept])

    const result = mountRememberedConnections()
    result.forget(getRememberedConnectionKey(forgotten))

    expect(result.connections).toEqual([kept])
  })
})
