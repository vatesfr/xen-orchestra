import { useV2vMappingLabels } from '@/modules/v2v/composables/use-v2v-mapping-labels.composable.ts'
import { createV2vDisk, createV2vPortGroup } from '@/test/create-v2v-inventory.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'

function mountLabels() {
  return mountComposableWithI18n(() => useV2vMappingLabels())
}

describe('getOriginTag', () => {
  it.each([
    ['default', 'global-default', 'neutral'],
    ['overridden', 'overridden', 'warning'],
  ] as const)('tags the %s origin', (origin, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getOriginTag(origin)).toEqual({ label: labels.t(labelKey), accent })
  })
})

describe('getPowerLabel', () => {
  it('tells the power state of a VM and its host', () => {
    const labels = mountLabels()

    expect(labels.getPowerLabel(V2V_VM_POWER_STATE.POWERED_ON, 'esx01')).toBe(
      labels.t('power-state-on-host', { power: labels.t('vm:status:running'), host: 'esx01' })
    )
  })

  it('only tells the power state while the host is unknown', () => {
    const labels = mountLabels()

    expect(labels.getPowerLabel(V2V_VM_POWER_STATE.POWERED_OFF, undefined)).toBe(labels.t('vm:status:halted'))
  })
})

describe('getSnapshotCountLabel', () => {
  it('counts the snapshots', () => {
    expect(mountLabels().getSnapshotCountLabel(2)).toBe('2')
  })

  it('tells there is none', () => {
    const labels = mountLabels()

    expect(labels.getSnapshotCountLabel(0)).toBe(labels.t('none'))
  })
})

describe('getDisksParts', () => {
  it('counts the disks then sums their sizes', () => {
    const disks = [createV2vDisk({ capacity: 80 * 1024 ** 3 }), createV2vDisk({ capacity: 40 * 1024 ** 3 })]

    expect(mountLabels().getDisksParts(disks)).toEqual(['2', '120 GiB'])
  })

  it('tells a VM without disk has none', () => {
    const labels = mountLabels()

    expect(labels.getDisksParts([])).toEqual([labels.t('none')])
  })
})

describe('getPortGroupParts', () => {
  it('names the port group then its VLAN', () => {
    const labels = mountLabels()

    expect(labels.getPortGroupParts(createV2vPortGroup())).toEqual(['PG-Prod', labels.t('vlan-id', { id: 10 })])
  })

  it('only names a port group without VLAN', () => {
    expect(mountLabels().getPortGroupParts(createV2vPortGroup({ vlan: undefined }))).toEqual(['PG-Prod'])
  })

  it('has no part without port group', () => {
    expect(mountLabels().getPortGroupParts(undefined)).toEqual([])
  })
})

it('labels each next transfer', () => {
  const labels = mountLabels()

  expect(labels.nextTransferLabels).toEqual({ delta: labels.t('delta-transfer'), full: labels.t('full-transfer') })
})

describe('getDiskDetailParts', () => {
  it('names the datastore of the disk then its size', () => {
    expect(mountLabels().getDiskDetailParts('ds-prod-01', 300 * 1024 ** 3)).toEqual(['ds-prod-01', '300 GiB'])
  })
})

describe('getNicDetailParts', () => {
  it('names the port group of the NIC, its VLAN, then tells its MAC is kept', () => {
    const labels = mountLabels()

    expect(labels.getNicDetailParts(createV2vPortGroup(), true)).toEqual([
      'PG-Prod',
      labels.t('vlan-id', { id: 10 }),
      labels.t('v2v:mac-kept'),
    ])
  })

  it('tells nothing of a MAC that changed', () => {
    const labels = mountLabels()

    expect(labels.getNicDetailParts(createV2vPortGroup(), false)).toEqual(['PG-Prod', labels.t('vlan-id', { id: 10 })])
  })
})
