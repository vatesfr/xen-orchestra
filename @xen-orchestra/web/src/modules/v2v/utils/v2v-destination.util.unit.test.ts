import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import {
  countV2vPoolResources,
  getOfferedV2vDestinationPrefill,
  getV2vDestinationPrefill,
  getV2vPoolDestinationChoices,
  getV2vPoolManagementNetworkId,
} from '@/modules/v2v/utils/v2v-destination.util.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif, createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'

const POOL = createPool()

const OTHER_POOL_ID = 'pool-2' as FrontXoPool['id']

const MANAGEMENT_NETWORK_ID = 'network-mgmt' as FrontXoNetwork['id']

const MANAGEMENT_PIF = createManagementPif(POOL, MANAGEMENT_NETWORK_ID)

describe('countV2vPoolResources', () => {
  it('counts the hosts, writable SRs and networks of each pool', () => {
    const counts = countV2vPoolResources([POOL, createPool({ id: OTHER_POOL_ID })], {
      hosts: [createHost(), createHost({ id: 'host-2' as FrontXoHost['id'] }), createHost({ $pool: OTHER_POOL_ID })],
      srs: [
        createSr(),
        createSr({ id: 'sr-iso' as FrontXoSr['id'], content_type: 'iso' }),
        createSr({ $pool: OTHER_POOL_ID }),
      ],
      networks: [createNetwork(), createNetwork({ id: 'network-2' as FrontXoNetwork['id'] })],
    })

    expect(counts.get(POOL.id)).toEqual({ hosts: 2, srs: 1, networks: 2 })
    expect(counts.get(OTHER_POOL_ID)).toEqual({ hosts: 1, srs: 1, networks: 0 })
  })

  it('leaves out the resources of a pool not given', () => {
    const counts = countV2vPoolResources([POOL], {
      hosts: [createHost({ $pool: OTHER_POOL_ID })],
      srs: [createSr({ $pool: OTHER_POOL_ID })],
      networks: [],
    })

    expect([...counts.keys()]).toEqual([POOL.id])
  })

  it('counts zero for a pool without resources', () => {
    expect(countV2vPoolResources([POOL], { hosts: [], srs: [], networks: [] }).get(POOL.id)).toEqual({
      hosts: 0,
      srs: 0,
      networks: 0,
    })
  })
})

describe('getV2vPoolDestinationChoices', () => {
  const writableSr = createSr()
  const isoSr = createSr({ id: 'sr-iso' as FrontXoSr['id'], content_type: 'iso' })
  const network = createNetwork()
  const template = createVmTemplate()
  const resources = {
    srs: [writableSr, isoSr, createSr({ $pool: OTHER_POOL_ID })],
    networks: [network, createNetwork({ $pool: OTHER_POOL_ID })],
    templates: [template, createVmTemplate({ $pool: OTHER_POOL_ID })],
  }

  it('offers the writable SRs, the networks and the templates of the pool', () => {
    expect(getV2vPoolDestinationChoices(POOL.id, resources)).toEqual({
      srs: [writableSr],
      networks: [network],
      templates: [template],
    })
  })

  it('offers nothing without a pool', () => {
    expect(getV2vPoolDestinationChoices(undefined, resources)).toEqual({ srs: [], networks: [], templates: [] })
  })
})

describe('getV2vPoolManagementNetworkId', () => {
  it('returns the network of the management PIF of the pool master', () => {
    const slavePif = createPif({ $host: 'host-2' as FrontXoHost['id'], management: true })

    expect(getV2vPoolManagementNetworkId(POOL, [slavePif, createPif(), MANAGEMENT_PIF])).toBe(MANAGEMENT_NETWORK_ID)
  })

  it('returns nothing when the master has no management PIF', () => {
    expect(getV2vPoolManagementNetworkId(POOL, [createPif()])).toBeUndefined()
  })
})

describe('getOfferedV2vDestinationPrefill', () => {
  const DEFAULTS = createV2vMigrationList().defaults

  const CHOICES = { srs: [createSr()], networks: [createNetwork()], templates: [createVmTemplate()] }

  it('keeps the defaults the pool offers', () => {
    expect(getOfferedV2vDestinationPrefill(DEFAULTS, CHOICES)).toEqual(DEFAULTS)
  })

  it('leaves out each default not offered yet, or gone from the pool', () => {
    expect(getOfferedV2vDestinationPrefill(DEFAULTS, { srs: [], networks: CHOICES.networks, templates: [] })).toEqual({
      sr: undefined,
      network: DEFAULTS.network,
      template: undefined,
    })
  })

  it('keeps nothing of an empty prefill', () => {
    expect(getOfferedV2vDestinationPrefill({}, CHOICES)).toEqual({
      sr: undefined,
      network: undefined,
      template: undefined,
    })
  })
})

describe('getV2vDestinationPrefill', () => {
  it('prefills the pool default SR and the management network, without template', () => {
    expect(getV2vDestinationPrefill(POOL, { srs: [createSr()], pifs: [MANAGEMENT_PIF] }, undefined)).toEqual({
      sr: POOL.default_SR,
      network: MANAGEMENT_NETWORK_ID,
      template: undefined,
    })
  })

  it.each([
    ['is not writable', createSr({ content_type: 'iso' })],
    ['is unknown', createSr({ id: 'sr-2' as FrontXoSr['id'] })],
  ])('leaves the SR empty when the pool default SR %s', (_, sr) => {
    expect(getV2vDestinationPrefill(POOL, { srs: [sr], pifs: [] }, undefined).sr).toBeUndefined()
  })

  it('keeps the defaults of the list stored for the pool', () => {
    const storedList = createV2vMigrationList()

    expect(getV2vDestinationPrefill(POOL, { srs: [createSr()], pifs: [MANAGEMENT_PIF] }, storedList)).toEqual(
      storedList.defaults
    )
  })
})
