import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  getV2vOverride,
  getV2vVmMapping,
  resolveV2vTarget,
  setV2vOverride,
} from '@/modules/v2v/utils/v2v-mapping.util.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import {
  V2V_DATA_DISK,
  V2V_DEBIAN_TEMPLATE,
  V2V_DEFAULT_SR,
  V2V_DISK_OVERRIDES,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_NIC_OVERRIDES,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'

const DEFAULTS = createV2vDestinationDefaults()

const { srs, networks, templates } = V2V_POOL_OFFERS

const DEFAULT_SR_TARGET = resolveV2vTarget(undefined, DEFAULTS.sr, srs)

const DEFAULT_NETWORK_TARGET = resolveV2vTarget(undefined, DEFAULTS.network, networks)

describe('resolveV2vTarget', () => {
  it('takes the override over the default', () => {
    expect(resolveV2vTarget(V2V_SSD_SR.id, DEFAULTS.sr, srs)).toEqual({
      value: V2V_SSD_SR.id,
      origin: 'overridden',
      isOffered: true,
    })
  })

  it('takes the default without override', () => {
    expect(resolveV2vTarget(undefined, DEFAULTS.sr, srs)).toEqual({
      value: DEFAULTS.sr,
      origin: 'default',
      isOffered: true,
    })
  })

  it.each([
    ['an override', V2V_SSD_SR.id, DEFAULTS.sr],
    ['a default', undefined, V2V_SSD_SR.id],
  ])('tells %s the pool does not offer', (_, override, defaultValue) => {
    expect(resolveV2vTarget(override, defaultValue, [V2V_DEFAULT_SR]).isOffered).toBe(false)
  })
})

describe('getV2vVmMapping', () => {
  it('maps the disks, the NICs and the template to the defaults of the list', () => {
    expect(getV2vVmMapping(V2V_MAPPED_VM, createV2vMigrationListVm(), DEFAULTS, V2V_POOL_OFFERS)).toEqual({
      disks: [
        { disk: V2V_SYSTEM_DISK, sr: DEFAULT_SR_TARGET },
        { disk: V2V_DATA_DISK, sr: DEFAULT_SR_TARGET },
      ],
      nics: [
        { nic: V2V_LAN_NIC, network: DEFAULT_NETWORK_TARGET },
        { nic: V2V_VLAN_NIC, network: DEFAULT_NETWORK_TARGET },
      ],
      template: resolveV2vTarget(undefined, DEFAULTS.template, templates),
      state: 'complete',
    })
  })

  it('maps each disk, NIC and the template to its override', () => {
    const listVm = createV2vMigrationListVm({
      disks: V2V_DISK_OVERRIDES,
      nics: V2V_NIC_OVERRIDES,
      template: V2V_DEBIAN_TEMPLATE.id,
    })

    expect(getV2vVmMapping(V2V_MAPPED_VM, listVm, DEFAULTS, V2V_POOL_OFFERS)).toEqual({
      disks: [
        { disk: V2V_SYSTEM_DISK, sr: DEFAULT_SR_TARGET },
        { disk: V2V_DATA_DISK, sr: resolveV2vTarget(V2V_SSD_SR.id, DEFAULTS.sr, srs) },
      ],
      nics: [
        { nic: V2V_LAN_NIC, network: DEFAULT_NETWORK_TARGET },
        { nic: V2V_VLAN_NIC, network: resolveV2vTarget(V2V_VLAN_NETWORK.id, DEFAULTS.network, networks) },
      ],
      template: resolveV2vTarget(V2V_DEBIAN_TEMPLATE.id, DEFAULTS.template, templates),
      state: 'complete',
    })
  })

  it.each([
    ['a disk', { disks: { [V2V_DATA_DISK.key]: 'sr-gone' } as V2vMigrationListVm['disks'] }, V2V_POOL_OFFERS],
    ['a NIC', { nics: { [V2V_VLAN_NIC.key]: 'network-gone' } as V2vMigrationListVm['nics'] }, V2V_POOL_OFFERS],
    ['the template', { template: 'template-gone' as FrontXoVmTemplate['id'] }, V2V_POOL_OFFERS],
    ['a default', {}, { ...V2V_POOL_OFFERS, srs: [V2V_SSD_SR] }],
  ])('tells the mapping incomplete when %s targets what the pool does not offer', (_, overrides, offers) => {
    expect(getV2vVmMapping(V2V_MAPPED_VM, createV2vMigrationListVm(overrides), DEFAULTS, offers).state).toBe(
      'incomplete'
    )
  })

  it('tells the mapping of a VM without disk nor NIC complete, whatever the SRs and networks offered', () => {
    const vm = createV2vVm({ disks: [], nics: [] })

    expect(
      getV2vVmMapping(vm, createV2vMigrationListVm(), DEFAULTS, { ...V2V_POOL_OFFERS, srs: [], networks: [] })
    ).toMatchObject({ disks: [], nics: [], state: 'complete' })
  })
})

describe('getV2vOverride', () => {
  it('keeps a value other than the default', () => {
    expect(getV2vOverride(false, true)).toBe(false)
  })

  it.each([
    ['its default', true],
    ['reset', undefined],
  ])('stores no override for a value %s', (_, value) => {
    expect(getV2vOverride(value, true)).toBeUndefined()
  })

  it('stores no override for a list equal to its default', () => {
    expect(getV2vOverride(['migrated-from:vmware'], ['migrated-from:vmware'])).toBeUndefined()
  })
})

describe('setV2vOverride', () => {
  const SYSTEM_DISK_OVERRIDE = { [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id } as V2vMigrationListVm['disks']

  const BOTH_DISKS_OVERRIDES = {
    [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id,
    [V2V_DATA_DISK.key]: V2V_SSD_SR.id,
  } as V2vMigrationListVm['disks']

  const CLEARING_VALUES = [
    ['set back to its default', DEFAULTS.sr],
    ['reset', undefined],
  ] as const

  it('overrides a key, keeping the other overrides', () => {
    expect(setV2vOverride(SYSTEM_DISK_OVERRIDE, V2V_DATA_DISK.key, V2V_SSD_SR.id, DEFAULTS.sr)).toEqual(
      BOTH_DISKS_OVERRIDES
    )
  })

  it('creates the overrides with their first key', () => {
    expect(setV2vOverride(undefined, V2V_SYSTEM_DISK.key, V2V_SSD_SR.id, DEFAULTS.sr)).toEqual(SYSTEM_DISK_OVERRIDE)
  })

  it.each(CLEARING_VALUES)('clears the override of a key %s, keeping the other overrides', (_, value) => {
    expect(setV2vOverride(BOTH_DISKS_OVERRIDES, V2V_DATA_DISK.key, value, DEFAULTS.sr)).toEqual(SYSTEM_DISK_OVERRIDE)
  })

  it.each(CLEARING_VALUES)('drops the overrides once their last key is %s', (_, value) => {
    expect(setV2vOverride(SYSTEM_DISK_OVERRIDE, V2V_SYSTEM_DISK.key, value, DEFAULTS.sr)).toBeUndefined()
  })

  it('creates no overrides for a key set to its default', () => {
    expect(setV2vOverride(undefined, V2V_SYSTEM_DISK.key, DEFAULTS.sr, DEFAULTS.sr)).toBeUndefined()
  })
})
