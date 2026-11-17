import { useV2vSelectedVmLabels } from '@/modules/v2v/composables/use-v2v-selected-vm-labels.composable.ts'
import type { V2vMappingSummary, V2vSelectedVmCheck, V2vVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import { DISKOR_POOL_NAME, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { createV2vUnsupportedCheck, V2V_SELECTED_VM_CHECK, V2V_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'

function mountLabels() {
  return mountComposableWithI18n(() => useV2vSelectedVmLabels())
}

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
  it.each([
    ['a ready', V2V_SELECTED_VM_CHECK.ready, 'ready', 'success'],
    ['a missing', V2V_SELECTED_VM_CHECK.notFound, 'v2v:not-found-in-source', 'danger'],
    ['a running', V2V_SELECTED_VM_CHECK.running, 'import-in-progress', 'danger'],
    ['an already migrated', V2V_SELECTED_VM_CHECK.alreadyMigrated, 'v2v:already-migrated-confirm-at-launch', 'warning'],
    ['an incompletely mapped', V2V_SELECTED_VM_CHECK.mappingIncomplete, 'v2v:check:mapping-incomplete', 'danger'],
    ['a fully supported', V2V_VM_CHECK.noUnsupportedDisk, 'v2v:check:no-unsupported-disk', 'success'],
    ['a snapshot-free', V2V_VM_CHECK.noSnapshot, 'v2v:check:no-snapshot', 'success'],
  ] as const)('tells %s VM', (_, check: V2vSelectedVmCheck | V2vVmCheck, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getCheckInfo(check)).toEqual({ label: labels.t(labelKey), accent })
  })

  it.each([
    ['rdm', 'v2v:unsupported-rdm-disk'],
    ['independent', 'v2v:unsupported-independent-disk'],
    ['encrypted', 'v2v:unsupported-encrypted-disk'],
  ] as const)('tells a VM unsupported for its %s disk', (reason, labelKey) => {
    const labels = mountLabels()

    expect(labels.getCheckInfo(createV2vUnsupportedCheck(reason))).toEqual({
      label: labels.t(labelKey),
      accent: 'danger',
    })
  })

  it('counts the snapshots of a VM', () => {
    const labels = mountLabels()

    expect(labels.getCheckInfo({ type: 'snapshots', level: 'warning', count: 2 })).toEqual({
      label: labels.t('v2v:check:n-snapshots', { n: 2 }),
      accent: 'warning',
    })
  })

  it('names the pool a VM is partially imported on', () => {
    const labels = mountLabels()

    expect(labels.getCheckInfo(V2V_SELECTED_VM_CHECK.partialOnOtherPool, DISKOR_POOL_NAME)).toEqual({
      label: labels.t('v2v:partial-import-on-pool', { pool: DISKOR_POOL_NAME }),
      accent: 'danger',
    })
  })

  it('names the pool by its id while its name is unknown', () => {
    const labels = mountLabels()

    expect(labels.getCheckInfo(V2V_SELECTED_VM_CHECK.partialOnOtherPool).label).toBe(
      labels.t('v2v:partial-import-on-pool', { pool: UNKNOWN_POOL_ID })
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
      labels.t('v2v:resumes-from-last-sync'),
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
