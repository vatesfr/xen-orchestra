import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import {
  createRememberedConnection,
  findRememberedConnection,
  forgetRememberedConnection,
  forgetRememberedPassword,
  fromXo5RememberedConnection,
  getRememberedConnectionKey,
  parseRememberedConnectionsStorage,
  sortRememberedConnectionsByLastUse,
  toV2vConnection,
  upsertRememberedConnection,
} from '@/modules/v2v/utils/v2v-remembered-connection.util.ts'
import { getV2vAddress } from '@/modules/v2v/utils/v2v-source.util.ts'
import {
  createOldAndRecentV2vRememberedConnections,
  createV2vConnection,
  createV2vRememberedConnection,
} from '@/test/create-v2v-connection.ts'
import { createV2vRememberedConnectionsStorage } from '@/test/v2v-remembered-connections-storage.ts'
import { V2V_PLATFORM } from '@vates/types'
import { omit } from 'lodash-es'

const EMPTY_STORAGE = createV2vRememberedConnectionsStorage([], false)

const CONNECTION_A = createV2vRememberedConnection({ host: 'a.lab' })

const CONNECTION_B = createV2vRememberedConnection({ host: 'b.lab' })

describe('getRememberedConnectionKey', () => {
  it('identifies a connection by its address and username', () => {
    const connection = { host: ' VCenter.Lab ', port: 8443, username: 'Admin' }

    expect(getRememberedConnectionKey(connection)).toBe(`${getV2vAddress(connection)}:Admin`)
  })
})

describe('parseRememberedConnectionsStorage', () => {
  it('keeps a valid storage', () => {
    const storage = createV2vRememberedConnectionsStorage([
      CONNECTION_A,
      createV2vRememberedConnection({ password: undefined }),
    ])

    expect(parseRememberedConnectionsStorage(storage)).toEqual(storage)
  })

  it.each([undefined, null, 'a string', 42, []])(
    'returns an empty storage for a value that is no storage (%j)',
    raw => {
      expect(parseRememberedConnectionsStorage(raw)).toEqual(EMPTY_STORAGE)
    }
  )

  it('returns an empty storage for an unknown version', () => {
    expect(
      parseRememberedConnectionsStorage({ ...createV2vRememberedConnectionsStorage([CONNECTION_A]), version: 2 })
    ).toEqual(EMPTY_STORAGE)
  })

  it('keeps the XO 5 import flag only when it is true', () => {
    expect(
      parseRememberedConnectionsStorage({ ...createV2vRememberedConnectionsStorage(), xo5Imported: 'yes' }).xo5Imported
    ).toBe(false)
    expect(
      parseRememberedConnectionsStorage(omit(createV2vRememberedConnectionsStorage(), 'xo5Imported')).xo5Imported
    ).toBe(false)
  })

  it('has no connection when the connections are not a list', () => {
    expect(
      parseRememberedConnectionsStorage({ ...createV2vRememberedConnectionsStorage(), connections: { host: 'a.lab' } })
        .connections
    ).toEqual([])
  })

  it.each([
    ['a missing host', omit(CONNECTION_B, 'host')],
    ['an unknown platform', { ...CONNECTION_B, platform: 'hyper-v' }],
    ['a text port', { ...CONNECTION_B, port: '443' }],
    ['a missing username', omit(CONNECTION_B, 'username')],
    ['a text SSL choice', { ...CONNECTION_B, skipSslCheck: 'true' }],
    ['a numeric password', { ...CONNECTION_B, password: 1234 }],
    ['a text last use date', { ...CONNECTION_B, lastUsedAt: 'yesterday' }],
    ['a value that is no object', 'b.lab'],
  ])('drops an entry with %s', (_case, invalidEntry) => {
    expect(
      parseRememberedConnectionsStorage({
        ...createV2vRememberedConnectionsStorage(),
        connections: [CONNECTION_A, invalidEntry],
      }).connections
    ).toEqual([CONNECTION_A])
  })
})

describe('createRememberedConnection', () => {
  const details = { product: 'VMware ESXi', version: '7.0.3', sourceId: 'esxi.lab:443', vmCount: 9, lastUsedAt: 1 }

  it('keeps the password when asked to', () => {
    const connection = createV2vConnection()

    expect(createRememberedConnection(connection, details, { withPassword: true })).toEqual({
      ...connection,
      ...details,
      platform: V2V_PLATFORM.VMWARE,
    })
  })

  it('leaves the password out otherwise', () => {
    expect(createRememberedConnection(createV2vConnection(), details, { withPassword: false })).not.toHaveProperty(
      'password'
    )
  })
})

describe('findRememberedConnection', () => {
  it('finds the connection with the given key, whatever the case of its host', () => {
    const key = getRememberedConnectionKey({ ...CONNECTION_B, host: 'B.LAB' })

    expect(findRememberedConnection([CONNECTION_A, CONNECTION_B], key)).toBe(CONNECTION_B)
  })

  it('finds nothing when no connection has the given key', () => {
    expect(findRememberedConnection([CONNECTION_A], getRememberedConnectionKey(CONNECTION_B))).toBeUndefined()
  })
})

describe('upsertRememberedConnection', () => {
  it('adds a connection to an empty list', () => {
    expect(upsertRememberedConnection([], CONNECTION_A)).toEqual([CONNECTION_A])
  })

  it('appends a connection with a new key', () => {
    expect(upsertRememberedConnection([CONNECTION_A], CONNECTION_B)).toEqual([CONNECTION_A, CONNECTION_B])
  })

  it('replaces the connection with the same key', () => {
    const updated = createV2vRememberedConnection({ host: 'A.LAB', vmCount: 2 })

    expect(upsertRememberedConnection([CONNECTION_A, CONNECTION_B], updated)).toEqual([updated, CONNECTION_B])
  })
})

describe('forgetRememberedConnection', () => {
  it('removes the connection with the given key', () => {
    expect(forgetRememberedConnection([CONNECTION_A, CONNECTION_B], getRememberedConnectionKey(CONNECTION_B))).toEqual([
      CONNECTION_A,
    ])
  })

  it('leaves the list unchanged for an unknown key', () => {
    expect(forgetRememberedConnection([CONNECTION_A], 'unknown:443:nobody')).toEqual([CONNECTION_A])
  })
})

describe('forgetRememberedPassword', () => {
  it('removes only the password of the connection with the given key', () => {
    expect(forgetRememberedPassword([CONNECTION_A, CONNECTION_B], getRememberedConnectionKey(CONNECTION_A))).toEqual([
      omit(CONNECTION_A, 'password'),
      CONNECTION_B,
    ])
  })
})

describe('sortRememberedConnectionsByLastUse', () => {
  it('puts the most recently used first and the never used last', () => {
    const { old, recent } = createOldAndRecentV2vRememberedConnections()
    const neverUsed: V2vRememberedConnection = omit(createV2vRememberedConnection({ host: 'never.lab' }), 'lastUsedAt')

    expect(sortRememberedConnectionsByLastUse([old, neverUsed, recent])).toEqual([recent, old, neverUsed])
  })
})

describe('fromXo5RememberedConnection', () => {
  it('converts the XO 5 remembered connection', () => {
    expect(fromXo5RememberedConnection({ host: 'esxi.lab', user: 'root', password: 'secret' })).toEqual({
      platform: V2V_PLATFORM.VMWARE,
      host: 'esxi.lab',
      port: 443,
      username: 'root',
      password: 'secret',
      skipSslCheck: true,
    })
  })

  it('reads the port XO 5 kept in the host', () => {
    expect(fromXo5RememberedConnection({ host: 'esxi.lab:8443', user: 'root', password: 'secret' })).toMatchObject({
      host: 'esxi.lab',
      port: 8443,
    })
  })

  it.each([null, ''])('omits a missing password (%j)', password => {
    expect(fromXo5RememberedConnection({ host: 'esxi.lab', user: 'root', password })).not.toHaveProperty('password')
  })

  it.each([
    { host: null, user: 'root', password: 'secret' },
    { host: '', user: 'root', password: 'secret' },
    { host: 'esxi.lab', user: null, password: 'secret' },
    { host: 'esxi.lab', user: '', password: 'secret' },
  ])('returns nothing without a host and a user (%j)', stored => {
    expect(fromXo5RememberedConnection(stored)).toBeUndefined()
  })
})

describe('toV2vConnection', () => {
  it('uses the remembered password', () => {
    expect(toV2vConnection(createV2vRememberedConnection({ password: 'stored' }))).toEqual(
      createV2vConnection({ password: 'stored' })
    )
  })

  it('prefers the given password over the remembered one', () => {
    expect(toV2vConnection(createV2vRememberedConnection({ password: 'stored' }), 'typed')?.password).toBe('typed')
  })

  it('uses the given password when none was remembered', () => {
    expect(toV2vConnection(omit(CONNECTION_A, 'password'), 'typed')?.password).toBe('typed')
  })

  it.each([undefined, ''])('returns nothing without any password (%j)', password => {
    expect(toV2vConnection({ ...omit(CONNECTION_A, 'password'), password })).toBeUndefined()
  })
})
