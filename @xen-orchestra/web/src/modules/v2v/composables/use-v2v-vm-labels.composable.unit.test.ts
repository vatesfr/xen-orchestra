import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vMappingSummary, V2vSelectedVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vUnsupportedReason, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'

function mountLabels() {
  return mountComposableWithI18n(() => useV2vVmLabels())
}

const NO_STATUS = { none: 0, running: 0, warm: 0, cold: 0 }

it('labels each migration status', () => {
  const labels = mountLabels()

  expect(labels.statusLabels).toEqual({
    none: labels.t('not-migrated'),
    running: labels.t('in-progress'),
    warm: labels.t('v2v:status:warm'),
    cold: labels.t('v2v:status:cold'),
  })
})

it('labels each power state', () => {
  const labels = mountLabels()

  expect(labels.powerLabels).toEqual({
    [V2V_VM_POWER_STATE.POWERED_ON]: labels.t('vm:status:running'),
    [V2V_VM_POWER_STATE.POWERED_OFF]: labels.t('vm:status:halted'),
    [V2V_VM_POWER_STATE.SUSPENDED]: labels.t('vm:status:suspended'),
  })
})

it('labels each preset', () => {
  const labels = mountLabels()

  expect(labels.presetLabels).toEqual({
    all: labels.t('all'),
    'not-migrated': labels.t('not-migrated'),
    'not-ready': labels.t('not-ready'),
    'in-progress': labels.t('in-progress'),
    warm: labels.t('v2v:status:warm'),
    cold: labels.t('v2v:status:cold'),
  })
})

describe('getStatusTag', () => {
  it.each([
    ['none', 'not-migrated', 'neutral'],
    ['running', 'in-progress', 'warning'],
    ['warm', 'v2v:status:warm', 'info'],
    ['cold', 'v2v:status:cold', 'success'],
  ] as const)('tags a supported %s VM with its status', (migration: V2vVmStatus, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getStatusTag({ migration })).toEqual({ label: labels.t(labelKey), accent })
  })

  it.each([
    ['rdm', 'v2v:unsupported-rdm-disk'],
    ['independent', 'v2v:unsupported-independent-disk'],
    ['encrypted', 'v2v:unsupported-encrypted-disk'],
  ] as const)('tags a VM unsupported for its %s disk', (unsupportedReason: V2vUnsupportedReason, labelKey) => {
    const labels = mountLabels()

    expect(labels.getStatusTag({ migration: 'none', unsupportedReason })).toEqual({
      label: labels.t(labelKey),
      accent: 'danger',
    })
  })

  it('tags an unsupported VM as unsupported whatever its status', () => {
    const labels = mountLabels()

    expect(labels.getStatusTag({ migration: 'cold', unsupportedReason: 'rdm' })).toEqual({
      label: labels.t('v2v:unsupported-rdm-disk'),
      accent: 'danger',
    })
  })
})

describe('getStatusCountLabel', () => {
  it.each([
    ['none', 'n-not-migrated'],
    ['running', 'n-in-progress'],
    ['warm', 'n-partially-migrated'],
    ['cold', 'n-migrated'],
  ] as const)('counts the %s VMs', (status: V2vVmStatus, labelKey) => {
    const labels = mountLabels()

    expect(labels.getStatusCountLabel(status, 3)).toBe(labels.t(labelKey, { n: 3 }))
  })
})

describe('getSummaryLabels', () => {
  it('counts the VMs then each status, in status order', () => {
    const labels = mountLabels()

    expect(labels.getSummaryLabels({ total: 10, counts: { cold: 1, warm: 2, running: 3, none: 4 } })).toEqual([
      labels.t('n-vms', { n: 10 }),
      labels.t('n-not-migrated', { n: 4 }),
      labels.t('n-in-progress', { n: 3 }),
      labels.t('n-partially-migrated', { n: 2 }),
      labels.t('n-migrated', { n: 1 }),
    ])
  })

  it('leaves out the statuses no VM has', () => {
    const labels = mountLabels()

    expect(labels.getSummaryLabels({ total: 5, counts: { ...NO_STATUS, none: 4, warm: 1 } })).toEqual([
      labels.t('n-vms', { n: 5 }),
      labels.t('n-not-migrated', { n: 4 }),
      labels.t('n-partially-migrated', { n: 1 }),
    ])
  })

  it('only counts the VMs when there is none', () => {
    const labels = mountLabels()

    expect(labels.getSummaryLabels({ total: 0, counts: NO_STATUS })).toEqual([labels.t('n-vms', { n: 0 })])
  })
})

describe('getKindTag', () => {
  it.each([
    ['new', 'new', 'neutral'],
    ['resume', 'resume', 'info'],
  ] as const)('tags a %s VM', (kind, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getKindTag(kind)).toEqual({ label: labels.t(labelKey), accent })
  })
})

describe('getCheckInfo', () => {
  const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']

  it.each([
    ['a ready', { type: 'ready', level: 'ready' }, 'ready', 'success'],
    ['a missing', { type: 'not-found', level: 'blocking' }, 'v2v:not-found-in-source', 'danger'],
    ['a running', { type: 'running', level: 'blocking' }, 'import-in-progress', 'danger'],
    [
      'an already migrated',
      { type: 'already-migrated', level: 'warning' },
      'v2v:already-migrated-confirm-at-launch',
      'warning',
    ],
    [
      'an incompletely mapped',
      { type: 'mapping-incomplete', level: 'blocking' },
      'v2v:check:mapping-incomplete',
      'danger',
    ],
  ] as const)('tells %s VM', (_, check: V2vSelectedVmCheck, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getCheckInfo(check)).toEqual({ label: labels.t(labelKey), accent })
  })

  it.each([
    ['rdm', 'v2v:unsupported-rdm-disk'],
    ['independent', 'v2v:unsupported-independent-disk'],
    ['encrypted', 'v2v:unsupported-encrypted-disk'],
  ] as const)('tells a VM unsupported for its %s disk', (reason, labelKey) => {
    const labels = mountLabels()

    expect(labels.getCheckInfo({ type: 'unsupported', level: 'blocking', reason })).toEqual({
      label: labels.t(labelKey),
      accent: 'danger',
    })
  })

  it('names the pool a VM is partially imported on', () => {
    const labels = mountLabels()

    expect(
      labels.getCheckInfo({ type: 'partial-on-other-pool', level: 'blocking', poolId: OTHER_POOL_ID }, DISKOR_POOL_NAME)
    ).toEqual({ label: labels.t('v2v:partial-import-on-pool', { pool: DISKOR_POOL_NAME }), accent: 'danger' })
  })

  it('names the pool by its id while its name is unknown', () => {
    const labels = mountLabels()

    expect(labels.getCheckInfo({ type: 'partial-on-other-pool', level: 'blocking', poolId: OTHER_POOL_ID }).label).toBe(
      labels.t('v2v:partial-import-on-pool', { pool: OTHER_POOL_ID })
    )
  })
})

describe('getMappingParts', () => {
  const MAPPED_SUMMARY: Extract<V2vMappingSummary, { type: 'mapped' }> = {
    type: 'mapped',
    diskCount: 2,
    srNames: ['sr-nvme-01', 'sr-ssd-01'],
    nicCount: 1,
    networkNames: ['VLAN 10'],
  }

  it('maps the disks to their SRs and the NICs to their networks', () => {
    const labels = mountLabels()

    expect(labels.getMappingParts(MAPPED_SUMMARY)).toEqual([
      labels.t('source-to-destination', {
        source: labels.t('n-disks', { n: 2 }),
        destination: 'sr-nvme-01, sr-ssd-01',
      }),
      labels.t('source-to-destination', { source: labels.t('n-nics', { n: 1 }), destination: 'VLAN 10' }),
    ])
  })

  it('only counts the disks and the NICs while their targets are unknown', () => {
    const labels = mountLabels()

    expect(labels.getMappingParts({ ...MAPPED_SUMMARY, srNames: undefined, networkNames: undefined })).toEqual([
      labels.t('n-disks', { n: 2 }),
      labels.t('n-nics', { n: 1 }),
    ])
  })

  it('leaves out the disks of a VM without disk', () => {
    const labels = mountLabels()

    expect(labels.getMappingParts({ ...MAPPED_SUMMARY, diskCount: 0, srNames: [] })).toEqual([
      labels.t('source-to-destination', { source: labels.t('n-nics', { n: 1 }), destination: 'VLAN 10' }),
    ])
  })

  it('leaves out the NICs of a VM without NIC', () => {
    const labels = mountLabels()

    expect(labels.getMappingParts({ ...MAPPED_SUMMARY, nicCount: 0, networkNames: [] })).toEqual([
      labels.t('source-to-destination', {
        source: labels.t('n-disks', { n: 2 }),
        destination: 'sr-nvme-01, sr-ssd-01',
      }),
    ])
  })

  it('tells a locked mapping resumes from the last sync', () => {
    const labels = mountLabels()

    expect(labels.getMappingParts({ type: 'locked' })).toEqual([
      labels.t('v2v:delta-from-last-sync'),
      labels.t('v2v:mapping-locked'),
    ])
  })

  it('has no part without summary', () => {
    expect(mountLabels().getMappingParts(undefined)).toEqual([])
  })
})

describe('getReadinessTags', () => {
  it('tags each readiness level, in level order', () => {
    const labels = mountLabels()

    expect(labels.getReadinessTags({ blocking: 1, warning: 2, ready: 3 })).toEqual([
      { label: labels.t('n-ready', { n: 3 }), accent: 'success' },
      { label: labels.t('n-warnings', { n: 2 }), accent: 'warning' },
      { label: labels.t('n-blocking', { n: 1 }), accent: 'danger' },
    ])
  })

  it('leaves out the levels no VM has', () => {
    const labels = mountLabels()

    expect(labels.getReadinessTags({ ready: 4, warning: 0, blocking: 0 })).toEqual([
      { label: labels.t('n-ready', { n: 4 }), accent: 'success' },
    ])
  })

  it('has no tag without VMs', () => {
    expect(mountLabels().getReadinessTags({ ready: 0, warning: 0, blocking: 0 })).toEqual([])
  })
})
