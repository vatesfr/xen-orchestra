import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { NOW } from '@/test/now.ts'

function mountConnectionStore() {
  return mountComposable(() => ({ store: useV2vConnectionStore() })).wrapper.vm.store
}

afterEach(() => {
  vi.useRealTimers()
})

describe('setConnection', () => {
  it('keeps the connection, the inventory and when it was loaded', () => {
    vi.useFakeTimers({ now: NOW })
    const store = mountConnectionStore()
    const connection = createV2vConnection()
    const inventory = createV2vInventory()

    store.setConnection(connection, inventory)

    expect(store.connection).toEqual(connection)
    expect(store.inventory).toEqual(inventory)
    expect(store.loadedAt).toBe(NOW)
  })
})

describe('sourceId', () => {
  it('is unknown before connecting', () => {
    expect(mountConnectionStore().sourceId).toBeUndefined()
  })

  it('is the vCenter instance UUID', () => {
    const store = mountConnectionStore()

    store.setConnection(createV2vConnection(), createV2vInventory({ instanceUuid: 'vcenter-uuid-2' }))

    expect(store.sourceId).toBe('vcenter-uuid-2')
  })

  it('is the connection address for a standalone ESXi', () => {
    const store = mountConnectionStore()

    store.setConnection(
      createV2vConnection({ host: 'esxi.lab', port: 443 }),
      createV2vInventory({ instanceUuid: undefined })
    )

    expect(store.sourceId).toBe('esxi.lab:443')
  })
})

describe('clear', () => {
  it('forgets the connection and its inventory', () => {
    const store = mountConnectionStore()
    store.setConnection(createV2vConnection(), createV2vInventory())

    store.clear()

    expect(store.connection).toBeUndefined()
    expect(store.inventory).toBeUndefined()
    expect(store.loadedAt).toBeUndefined()
    expect(store.sourceId).toBeUndefined()
  })
})
