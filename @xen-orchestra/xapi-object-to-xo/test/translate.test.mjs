import { describe, expect, it } from 'vitest'

import xapiObjectToXo from '../index.mjs'
import { createXapiGraph } from '../browser/index.mjs'
import { recordsByType, REFS } from './fixtures/pool-records.mjs'

const build = () => {
  const { getObjectByRef } = createXapiGraph({ recordsByType })

  return {
    getObjectByRef,
    translate: ref => xapiObjectToXo(getObjectByRef(ref)),
  }
}

// Walks the output looking for anything that still looks like an opaque ref.
// `_xapiRef` is excluded: holding the ref is its entire purpose.
const findOpaqueRefs = (value, path = '$', found = []) => {
  if (typeof value === 'string') {
    if (value.startsWith('OpaqueRef:')) {
      found.push(`${path} = ${value}`)
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => findOpaqueRefs(item, `${path}[${i}]`, found))
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key !== '_xapiRef') {
        findOpaqueRefs(item, `${path}.${key}`, found)
      }
    }
  }
  return found
}

describe('the object graph', () => {
  it('gives every record the properties the transform reads', () => {
    const { getObjectByRef } = build()
    const vm = getObjectByRef(REFS.VM)

    expect(vm.$type).toBe('vm')
    expect(vm.$id).toBe('vm-uuid-0000')
    expect(vm.$ref).toBe(REFS.VM)
    expect(vm.$pool.$id).toBe('pool-uuid-0000')
  })

  it('resolves single-ref links to records', () => {
    const { getObjectByRef } = build()
    const vm = getObjectByRef(REFS.VM)

    expect(vm.$metrics.uuid).toBe('vm-metrics-uuid-0000')
    expect(vm.$guest_metrics.uuid).toBe('vm-gm-uuid-0000')
    expect(vm.$resident_on.name_label).toBe('poc-host')
  })

  it('resolves set-of-ref links to arrays of records', () => {
    const { getObjectByRef } = build()
    const vm = getObjectByRef(REFS.VM)

    expect(vm.$VBDs.map(vbd => vbd.uuid)).toEqual(['vbd-uuid-0000'])
    expect(vm.$snapshots.map(snapshot => snapshot.uuid)).toEqual(['vm-snap-uuid-0000'])
  })

  it('traverses more than one hop: VM -> VBD -> VDI -> SR', () => {
    const { getObjectByRef } = build()
    const [vbd] = getObjectByRef(REFS.VM).$VBDs

    expect(vbd.$VDI.$SR.name_label).toBe('Local storage')
  })
})

describe('translating a running VM', () => {
  it('produces an XO object', () => {
    const { translate } = build()
    const vm = translate(REFS.VM)

    expect(vm.type).toBe('VM')
    expect(vm.id).toBe('vm-uuid-0000')
    expect(vm.uuid).toBe('vm-uuid-0000')
    expect(vm.name_label).toBe('poc-vm')
    expect(vm.power_state).toBe('Running')
    expect(vm.virtualizationMode).toBe('hvm')
    expect(vm.tags).toEqual(['production', 'poc'])
    expect(vm.notes).toBe('fixture notes')
  })

  it('rewrites every link from an opaque ref to an XO id', () => {
    const { translate } = build()
    const vm = translate(REFS.VM)

    expect(vm.$container).toBe('host-uuid-0000')
    expect(vm.$pool).toBe('pool-uuid-0000')
    expect(vm.snapshots).toEqual(['vm-snap-uuid-0000'])
    expect(vm.$VBDs).toEqual(['vbd-uuid-0000'])
    expect(vm.VIFs).toEqual(['vif-uuid-0000'])
    expect(vm.VTPMs).toEqual(['vtpm-uuid-0000'])
  })

  it('leaves no opaque ref anywhere in the output', () => {
    const { translate } = build()

    expect(findOpaqueRefs(translate(REFS.VM))).toEqual([])
  })

  it('derives guest-tools data from guest_metrics', () => {
    const { translate } = build()
    const vm = translate(REFS.VM)

    expect(vm.pvDriversVersion).toBe('7.30.0-123')
    expect(vm.pvDriversDetected).toBe(true)
    expect(vm.managementAgentDetected).toBe(true)
    expect(vm.os_version.name).toBe('Debian GNU/Linux 12 (bookworm)')
    expect(vm.addresses).toEqual({ '0/ipv4/0': '192.168.1.42', '0/ipv6/0': 'fe80::1' })
    expect(vm.mainIpAddress).toBe('192.168.1.42')
  })

  it('reads numbers off metrics and platform', () => {
    const { translate } = build()
    const vm = translate(REFS.VM)

    expect(vm.CPUs).toEqual({ max: 4, number: 2 })
    expect(vm.coresPerSocket).toBe(2)
    expect(vm.memory.size).toBe(4294967296)
    expect(vm.startTime).toBe(1789459200) // 20260915T08:00:00Z, parsed by d3-time-format
    expect(vm.installTime).toBe(1767254400) // 20260101T08:00:00Z
    expect(vm.vga).toBe('std')
    expect(vm.videoram).toBe(8)
    expect(vm.secureBoot).toBe(false)
    expect(vm.needsVtpm).toBe(true)
  })

  it('exposes the opaque ref as _xapiRef, and freezes the result', () => {
    const { translate } = build()
    const vm = translate(REFS.VM)

    expect(vm._xapiRef).toBe(REFS.VM)
    expect(Object.isFrozen(vm)).toBe(true)
  })
})

describe('translating a halted snapshot', () => {
  it('falls back to the pool as $container', () => {
    const { translate } = build()
    const snapshot = translate(REFS.VM_SNAPSHOT)

    expect(snapshot.$container).toBe('pool-uuid-0000')
    expect(snapshot.type).toBe('VM-snapshot')
    expect(snapshot.$snapshot_of).toBe('vm-uuid-0000')
  })

  it('leaves no opaque ref anywhere in the output', () => {
    const { translate } = build()

    expect(findOpaqueRefs(translate(REFS.VM_SNAPSHOT))).toEqual([])
  })
})

describe('a legacy host (platform_version < 2.1.1)', () => {
  // Exercises the `mapFilter` branch of the host transform, which modern hosts
  // short-circuit via `supplementalPacks || ...`.
  const legacy = {
    ...recordsByType,
    host: {
      [REFS.HOST]: {
        ...recordsByType.host[REFS.HOST],
        software_version: {
          ...recordsByType.host[REFS.HOST].software_version,
          platform_version: '2.0.0',
          'vates:xoa': 'XOA, version 5.0.0',
        },
      },
    },
  }

  it('derives supplementalPacks from software_version', () => {
    const { getObjectByRef } = createXapiGraph({ recordsByType: legacy })
    const host = xapiObjectToXo(getObjectByRef(REFS.HOST))

    expect(host.supplementalPacks).toEqual([
      { name: 'xoa', description: 'XOA', author: 'vates', version: '5.0.0' },
    ])
  })
})

describe('records in XO Lite shape', () => {
  // Lite's `buildXoObject()` stores `{ ...record, $ref }`, so the ref is *inside*
  // the record as well as being its key. Feed exactly that.
  const liteShaped = Object.fromEntries(
    Object.entries(recordsByType).map(([type, records]) => [
      type,
      Object.fromEntries(Object.entries(records).map(([ref, record]) => [ref, { ...record, $ref: ref }])),
    ])
  )

  it('translates identically whether or not $ref is inside the record', () => {
    const fromLite = createXapiGraph({ recordsByType: liteShaped })
    const fromGetAllRecords = createXapiGraph({ recordsByType })

    expect(xapiObjectToXo(fromLite.getObjectByRef(REFS.VM))).toEqual(
      xapiObjectToXo(fromGetAllRecords.getObjectByRef(REFS.VM))
    )
  })

  it('does not leak $ref into the XO object as a field', () => {
    const { getObjectByRef } = createXapiGraph({ recordsByType: liteShaped })
    const vm = xapiObjectToXo(getObjectByRef(REFS.VM))

    expect(vm.$ref).toBeUndefined()
    expect(vm._xapiRef).toBe(REFS.VM)
  })
})

// Found while building the fixture. Not a POC artefact: this is master's
// behaviour, reached through the unmodified transform.
describe('latent bug in the transform (unrelated to the browser question)', () => {
  it('throws when `recommendations` holds exactly one restriction', () => {
    const oneRestriction = {
      ...recordsByType,
      vm: {
        [REFS.VM]: {
          ...recordsByType.vm[REFS.VM],
          recommendations: '<restrictions><restriction field="supports-uefi" value="yes"/></restrictions>',
        },
      },
    }
    const { getObjectByRef } = createXapiGraph({ recordsByType: oneRestriction })

    // fast-xml-parser returns an object for a lone element and an array for
    // several; `isFirmwareSupported` calls `.find()` without normalizing.
    expect(() => xapiObjectToXo(getObjectByRef(REFS.VM))).toThrow('restrictions.find is not a function')
  })
})

describe('other types on the VM neighbourhood', () => {
  it.each([
    ['pool', REFS.POOL, 'pool'],
    ['host', REFS.HOST, 'host'],
    ['VBD', REFS.VBD, 'VBD'],
    ['VDI', REFS.VDI, 'VDI'],
    ['SR', REFS.SR, 'SR'],
    ['VIF', REFS.VIF, 'VIF'],
    ['network', REFS.NETWORK, 'network'],
    ['VTPM', REFS.VTPM, 'VTPM'],
  ])('translates a %s without leaking opaque refs', (_label, ref, expectedType) => {
    const { translate } = build()
    const xoObject = translate(ref)

    expect(xoObject.type).toBe(expectedType)
    expect(findOpaqueRefs(xoObject)).toEqual([])
  })
})
