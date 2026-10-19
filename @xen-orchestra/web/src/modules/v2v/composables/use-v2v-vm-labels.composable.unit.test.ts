import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vUnsupportedReason, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
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
