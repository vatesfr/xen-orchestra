import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { V2vVmStatus } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
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

describe('getLaunchGroupHeading', () => {
  it.each([
    ['excluded', 'v2v:launch-group:excluded', 'danger'],
    ['migrated', 'v2v:already-fully-migrated', 'warning'],
    ['resumed', 'v2v:launch-group:resumed', 'brand'],
    ['new', 'v2v:launch-group:new', 'success'],
  ] as const)('heads the %s group with its label and accent', (type, labelKey, accent) => {
    const labels = mountLabels()

    expect(labels.getLaunchGroupHeading(type)).toEqual({ label: labels.t(labelKey), accent })
  })
})

describe('getReviewSummaryParts', () => {
  it('names the destination pool, counts the VMs of the list, then the excluded ones and those to confirm', () => {
    const labels = mountLabels()

    expect(labels.getReviewSummaryParts(DISKOR_POOL_NAME, 7, { excluded: 2, unconfirmed: 1 })).toEqual([
      labels.t('destination-pool-named', { name: DISKOR_POOL_NAME }),
      labels.t('n-vms-in-list', { n: 7 }),
      labels.t('v2v:n-excluded', { n: 2 }),
      labels.t('n-need-confirmation', { n: 1 }),
    ])
  })

  it('leaves out the counts at zero and a pool still unknown', () => {
    const labels = mountLabels()

    expect(labels.getReviewSummaryParts(undefined, 3, { excluded: 0, unconfirmed: 0 })).toEqual([
      labels.t('n-vms-in-list', { n: 3 }),
    ])
  })
})

describe('getResumedVmParts', () => {
  it.each([
    ['delta', 'v2v:delta-from-last-sync'],
    ['full', 'full-transfer'],
  ] as const)('tells the %s transfer, where the VM continues, and that its mapping is kept', (transfer, labelKey) => {
    const labels = mountLabels()

    expect(labels.getResumedVmParts(transfer, DISKOR_POOL_NAME, ['sr-nvme-01', 'sr-ssd-01'])).toEqual([
      labels.t(labelKey),
      labels.t('v2v:continues-on-pool-sr', { pool: DISKOR_POOL_NAME, srs: 'sr-nvme-01, sr-ssd-01' }),
      labels.t('v2v:mapping-locked'),
    ])
  })
})

describe('getCutoverLabel', () => {
  it('tells when the VM was cut over', () => {
    const labels = mountLabels()
    const cutoverAt = Date.UTC(2026, 9, 2)

    expect(labels.getCutoverLabel(cutoverAt)).toBe(labels.t('v2v:cutover-done-on', { date: formatDateTime(cutoverAt) }))
  })

  it('tells nothing while the cutover date is unknown', () => {
    expect(mountLabels().getCutoverLabel(undefined)).toBeUndefined()
  })
})

describe('getNewVmsSummary', () => {
  it('names the VMs, then the SRs they go to', () => {
    const labels = mountLabels()

    expect(labels.getNewVmsSummary(['app-03', 'build-02'], ['sr-nvme-01', 'sr-hdd-02'])).toBe(
      labels.t('source-to-destination', { source: 'app-03, build-02', destination: 'sr-nvme-01, sr-hdd-02' })
    )
  })

  it('only names the VMs while their SRs are unknown', () => {
    expect(mountLabels().getNewVmsSummary(['app-03', 'build-02'], undefined)).toBe('app-03, build-02')
  })
})

describe('getStartProblemLabel', () => {
  it('names the VM of the problem', () => {
    const labels = mountLabels()

    expect(labels.getStartProblemLabel('RDM disk', 'web-01')).toBe(
      labels.t('v2v:vm-start-problem', { vm: 'web-01', message: 'RDM disk' })
    )
  })

  it('only tells a problem of the whole launch', () => {
    expect(mountLabels().getStartProblemLabel('tags are not supported', undefined)).toBe('tags are not supported')
  })
})

describe('getLaunchOptionLabel', () => {
  it.each([
    [true, 'option-on'],
    [false, 'option-off'],
  ] as const)('tells a launch option set to %s', (value, labelKey) => {
    const labels = mountLabels()

    expect(labels.getLaunchOptionLabel(value, !value)).toBe(labels.t(labelKey))
  })

  it.each([
    [true, 'option-on'],
    [false, 'option-off'],
  ] as const)('reads a launch option left to its default of %s as that default', (defaultValue, labelKey) => {
    const labels = mountLabels()

    expect(labels.getLaunchOptionLabel(undefined, defaultValue)).toBe(
      labels.t('default-value', { value: labels.t(labelKey) })
    )
  })
})
