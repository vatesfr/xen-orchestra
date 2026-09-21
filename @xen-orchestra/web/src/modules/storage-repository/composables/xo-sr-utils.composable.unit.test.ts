import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useGetPbdsInScope, useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSr } from '@/test/create-sr.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { ref } from 'vue'

// Read only when the composable runs, so the module-scope collections are already initialized
const pbdsById = new Map<FrontXoPbd['id'], FrontXoPbd>()
const hostsById = new Map<FrontXoHost['id'], FrontXoHost>()
const pbdsBySr = ref(new Map<FrontXoSr['id'], FrontXoPbd[]>())

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: (ids: FrontXoPbd['id'][]) => ids.flatMap(id => pbdsById.get(id) ?? []),
    pbdsBySr,
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    getHostById: (id: FrontXoHost['id'] | undefined) => (id === undefined ? undefined : hostsById.get(id)),
  })) as unknown as typeof useXoHostCollection,
}))

const FIRST_HOST_ID = 'host-1' as FrontXoHost['id']
const SECOND_HOST_ID = 'host-2' as FrontXoHost['id']

const FIRST_HOST_SCOPE: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: FIRST_HOST_ID }
const POOL_SCOPE: SrScope = { type: SR_SCOPE_TYPE.POOL }

const attachedPbd = createPbd({ id: 'pbd-attached' as FrontXoPbd['id'], host: FIRST_HOST_ID, attached: true })
const detachedPbd = createPbd({ id: 'pbd-detached' as FrontXoPbd['id'], host: SECOND_HOST_ID, attached: false })

beforeEach(() => {
  pbdsById.clear()
  hostsById.clear()
  pbdsBySr.value = new Map()
})

function givenSrWithPbds(pbds: FrontXoPbd[], overrides: Partial<FrontXoSr> = {}) {
  const sr = createSr({ ...overrides, $PBDs: pbds.map(pbd => pbd.id) as FrontXoSr['$PBDs'] })

  pbds.forEach(pbd => pbdsById.set(pbd.id, pbd))
  pbdsBySr.value.set(sr.id, pbds)

  return sr
}

function givenHosts(...hosts: FrontXoHost[]) {
  hosts.forEach(host => hostsById.set(host.id, host))
}

function mountGetPbdsInScope() {
  return mountComposable(() => useGetPbdsInScope()).wrapper.vm
}

function mountSrUtils(sr?: FrontXoSr, scope?: SrScope) {
  return mountComposable(() =>
    useXoSrUtils(
      () => sr,
      () => scope ?? POOL_SCOPE
    )
  ).wrapper.vm
}

describe('getPbdsInScope', () => {
  it('reads every PBD of the SR when the scope is the whole pool', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().getPbdsInScope(sr, POOL_SCOPE)).toEqual([attachedPbd, detachedPbd])
  })

  it('keeps only the PBD plugged into the host the scope is about', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().getPbdsInScope(sr, FIRST_HOST_SCOPE)).toEqual([attachedPbd])
  })

  it('is empty when the SR has no PBD on the host the scope is about', () => {
    const sr = givenSrWithPbds([detachedPbd])

    expect(mountGetPbdsInScope().getPbdsInScope(sr, FIRST_HOST_SCOPE)).toEqual([])
  })

  it('is empty when the SR has no PBD at all', () => {
    const sr = givenSrWithPbds([])

    expect(mountGetPbdsInScope().getPbdsInScope(sr, POOL_SCOPE)).toEqual([])
  })
})

describe('getAttachedPbdsInScope', () => {
  it('keeps only the PBDs that are plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().getAttachedPbdsInScope(sr, POOL_SCOPE)).toEqual([attachedPbd])
  })

  it('leaves out a plugged-in PBD on another host than the one the scope is about', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(
      mountGetPbdsInScope().getAttachedPbdsInScope(sr, { type: SR_SCOPE_TYPE.HOST, hostId: SECOND_HOST_ID })
    ).toEqual([])
  })
})

describe('getDetachedPbdsInScope', () => {
  it('keeps only the PBDs that are unplugged', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().getDetachedPbdsInScope(sr, POOL_SCOPE)).toEqual([detachedPbd])
  })

  it('leaves out an unplugged PBD on another host than the one the scope is about', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().getDetachedPbdsInScope(sr, FIRST_HOST_SCOPE)).toEqual([])
  })
})

describe('getSrPbdsSignature', () => {
  it('changes when a PBD of the SR is unplugged', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()
    const sr = givenSrWithPbds([attachedPbd])
    const connectedSignature = getSrPbdsSignature(sr, POOL_SCOPE)

    givenSrWithPbds([{ ...attachedPbd, attached: false }])

    expect(getSrPbdsSignature(sr, POOL_SCOPE)).not.toBe(connectedSignature)
  })

  it('is stable while the PBDs of the SR do not change', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(getSrPbdsSignature(sr, POOL_SCOPE)).toBe(getSrPbdsSignature(sr, POOL_SCOPE))
  })

  it('changes when the scope narrows to a single host', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(getSrPbdsSignature(sr, FIRST_HOST_SCOPE)).not.toBe(getSrPbdsSignature(sr, POOL_SCOPE))
  })

  it('still tells two SRs without any PBD apart', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()
    const sr = givenSrWithPbds([])
    const otherSr = givenSrWithPbds([], { id: 'sr-other' as FrontXoSr['id'] })

    expect(getSrPbdsSignature(sr, POOL_SCOPE)).not.toBe(getSrPbdsSignature(otherSr, POOL_SCOPE))
  })

  it('tells the two scopes apart when there is no SR to read', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()

    expect(getSrPbdsSignature(undefined, FIRST_HOST_SCOPE)).not.toBe(getSrPbdsSignature(undefined, POOL_SCOPE))
  })

  it('tells two hosts apart when there is no SR to read', () => {
    const { getSrPbdsSignature } = mountGetPbdsInScope()

    expect(getSrPbdsSignature(undefined, FIRST_HOST_SCOPE)).not.toBe(
      getSrPbdsSignature(undefined, { type: SR_SCOPE_TYPE.HOST, hostId: SECOND_HOST_ID })
    )
  })
})

describe('isConnectedInScope', () => {
  it('is connected as soon as one PBD in scope is plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().isConnectedInScope(sr, POOL_SCOPE)).toBe(true)
  })

  it('is not connected when the plugged-in PBD is on another host', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().isConnectedInScope(sr, { type: SR_SCOPE_TYPE.HOST, hostId: SECOND_HOST_ID })).toBe(
      false
    )
  })

  it('is not connected when the SR has no PBD at all', () => {
    const sr = givenSrWithPbds([])

    expect(mountGetPbdsInScope().isConnectedInScope(sr, POOL_SCOPE)).toBe(false)
  })
})

describe('isPartiallyConnectedInScope', () => {
  it('is partially connected when some PBDs in scope are plugged in and others are not', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().isPartiallyConnectedInScope(sr, POOL_SCOPE)).toBe(true)
  })

  it('is not partially connected when every PBD in scope is plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd])

    expect(mountGetPbdsInScope().isPartiallyConnectedInScope(sr, POOL_SCOPE)).toBe(false)
  })

  it('is not partially connected when every PBD in scope is unplugged', () => {
    const sr = givenSrWithPbds([detachedPbd])

    expect(mountGetPbdsInScope().isPartiallyConnectedInScope(sr, POOL_SCOPE)).toBe(false)
  })

  it('is not partially connected once the scope narrows to a host with a single PBD', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountGetPbdsInScope().isPartiallyConnectedInScope(sr, FIRST_HOST_SCOPE)).toBe(false)
  })
})

describe('pbdsInScope', () => {
  it('reads the PBDs of the SR it was given', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr).pbdsInScope).toEqual([attachedPbd, detachedPbd])
  })

  it('narrows to the host the scope is about', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr, FIRST_HOST_SCOPE).pbdsInScope).toEqual([attachedPbd])
  })

  it('covers the whole pool when no scope is given', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountComposable(() => useXoSrUtils(sr)).wrapper.vm.pbdsInScope).toEqual([attachedPbd, detachedPbd])
  })

  it('is empty while there is no SR to read', () => {
    expect(mountSrUtils().pbdsInScope).toEqual([])
  })

  it('follows the scope when the page moves from a pool to a host', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])
    const scope = ref<SrScope>(POOL_SCOPE)
    const result = mountComposable(() => useXoSrUtils(sr, scope)).wrapper.vm

    expect(result.pbdsInScope).toEqual([attachedPbd, detachedPbd])

    scope.value = FIRST_HOST_SCOPE

    expect(result.pbdsInScope).toEqual([attachedPbd])
  })
})

describe('srConnectionStatus', () => {
  it('reports the SR as connected when every PBD in scope is plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd])

    expect(mountSrUtils(sr).srConnectionStatus).toBe(CONNECTION_STATUS.CONNECTED)
  })

  it('reports the SR as partially connected when only some PBDs in scope are plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr).srConnectionStatus).toBe(CONNECTION_STATUS.PARTIALLY_CONNECTED)
  })

  it('reports the SR as disconnected when every PBD in scope is unplugged', () => {
    const sr = givenSrWithPbds([detachedPbd])

    expect(mountSrUtils(sr).srConnectionStatus).toBe(CONNECTION_STATUS.DISCONNECTED)
  })

  it('reports the SR as connected on a host whose only PBD is plugged in', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr, FIRST_HOST_SCOPE).srConnectionStatus).toBe(CONNECTION_STATUS.CONNECTED)
  })

  it('reports disconnected while there is no SR to read', () => {
    expect(mountSrUtils().srConnectionStatus).toBe(CONNECTION_STATUS.DISCONNECTED)
  })
})

describe('isPartiallyConnectedInScope', () => {
  it('follows the PBDs of the SR it was given', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr).isPartiallyConnectedInScope).toBe(true)
  })

  it('is false once the scope narrows to a host with a single plugged-in PBD', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr, FIRST_HOST_SCOPE).isPartiallyConnectedInScope).toBe(false)
  })

  it('is false while there is no SR to read', () => {
    expect(mountSrUtils().isPartiallyConnectedInScope).toBe(false)
  })
})

describe('srStatusIcon', () => {
  it('names the SR icon matching the connection status in scope', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr).srStatusIcon).toBe('object:sr:partially-connected')
  })

  it('names the connected SR icon once the scope narrows to a plugged-in host', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd])

    expect(mountSrUtils(sr, FIRST_HOST_SCOPE).srStatusIcon).toBe('object:sr:connected')
  })
})

describe('getSrStatusIcon', () => {
  it('names the icon of another SR than the one the composable follows', () => {
    const sr = givenSrWithPbds([attachedPbd])
    const otherSr = givenSrWithPbds([detachedPbd], { id: 'sr-other' as FrontXoSr['id'] })

    expect(mountSrUtils(sr).getSrStatusIcon(otherSr)).toBe('object:sr:disconnected')
  })

  it('reads that SR in the scope the composable was given', () => {
    const sr = givenSrWithPbds([attachedPbd, detachedPbd], { id: 'sr-other' as FrontXoSr['id'] })

    expect(mountSrUtils(undefined, FIRST_HOST_SCOPE).getSrStatusIcon(sr)).toBe('object:sr:connected')
  })
})

describe('getSrLocation', () => {
  it('reports a shared SR as shared rather than naming a host', () => {
    givenHosts(createHost({ id: FIRST_HOST_ID, name_label: 'Primary Host' }))

    const sr = givenSrWithPbds([attachedPbd], { shared: true })

    expect(mountSrUtils(sr).getSrLocation(sr)).toBe(t('shared'))
  })

  it('names the host a local SR is plugged into', () => {
    givenHosts(createHost({ id: FIRST_HOST_ID, name_label: 'Primary Host' }))

    const sr = givenSrWithPbds([attachedPbd], { shared: false })

    expect(mountSrUtils(sr).getSrLocation(sr)).toBe('Primary Host')
  })

  it('names the first host it knows among the PBDs of the SR', () => {
    givenHosts(createHost({ id: SECOND_HOST_ID, name_label: 'Secondary Host' }))

    const sr = givenSrWithPbds([attachedPbd, detachedPbd], { shared: false })

    expect(mountSrUtils(sr).getSrLocation(sr)).toBe('Secondary Host')
  })

  it('reports an unknown location when no host of the SR is known', () => {
    const sr = givenSrWithPbds([attachedPbd], { shared: false })

    expect(mountSrUtils(sr).getSrLocation(sr)).toBe(t('unknown'))
  })

  it('reports an unknown location when the SR has no PBD', () => {
    const sr = givenSrWithPbds([], { shared: false })

    expect(mountSrUtils(sr).getSrLocation(sr)).toBe(t('unknown'))
  })
})

describe('getSrAccessModeLabel', () => {
  it('reports a shared SR as shared', () => {
    const sr = createSr({ shared: true })

    expect(mountSrUtils(sr).getSrAccessModeLabel(sr)).toBe(t('shared'))
  })

  it('reports an unshared SR as local', () => {
    const sr = createSr({ shared: false })

    expect(mountSrUtils(sr).getSrAccessModeLabel(sr)).toBe(t('local'))
  })
})

describe('getSrProvisioningLabel', () => {
  it('reports the allocation strategy of the SR', () => {
    const sr = createSr({ allocationStrategy: 'thick' })

    expect(mountSrUtils(sr).getSrProvisioningLabel(sr)).toBe('thick')
  })

  it('reports an unknown provisioning when the SR declares no allocation strategy', () => {
    const sr = createSr({ allocationStrategy: undefined })

    expect(mountSrUtils(sr).getSrProvisioningLabel(sr)).toBe(t('unknown'))
  })
})
