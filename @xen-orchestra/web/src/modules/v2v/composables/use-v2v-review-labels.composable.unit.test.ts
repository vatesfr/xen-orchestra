import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { formatDateTime } from '@core/utils/time.util.ts'

describe('getLaunchGroupHeading', () => {
  it.each([
    ['excluded', 'v2v:launch-group:excluded', 'danger'],
    ['migrated', 'v2v:already-fully-migrated', 'warning'],
    ['resumed', 'v2v:launch-group:resumed', 'brand'],
    ['new', 'v2v:launch-group:new', 'success'],
  ] as const)('heads the %s group with its label and accent', (type, labelKey, accent) => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getLaunchGroupHeading(type)).toEqual({ label: labels.t(labelKey), accent })
  })
})

describe('getReviewSummaryParts', () => {
  it('names the destination pool, counts the VMs of the list, then the excluded ones and those to confirm', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getReviewSummaryParts(DISKOR_POOL_NAME, 7, { excluded: 2, unconfirmed: 1 })).toEqual([
      labels.t('destination-pool-named', { name: DISKOR_POOL_NAME }),
      labels.t('n-vms-in-list', { n: 7 }),
      labels.t('v2v:n-excluded', { n: 2 }),
      labels.t('n-need-confirmation', { n: 1 }),
    ])
  })

  it('leaves out the counts at zero and a pool still unknown', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

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
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getResumedVmParts(transfer, DISKOR_POOL_NAME, ['sr-nvme-01', 'sr-ssd-01'])).toEqual([
      labels.t(labelKey),
      labels.t('v2v:continues-on-pool-sr', { pool: DISKOR_POOL_NAME, srs: 'sr-nvme-01, sr-ssd-01' }),
      labels.t('v2v:mapping-locked'),
    ])
  })
})

describe('getCutoverLabel', () => {
  it('tells when the VM was cut over', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)
    const cutoverAt = Date.UTC(2026, 9, 2)

    expect(labels.getCutoverLabel(cutoverAt)).toBe(labels.t('v2v:cutover-done-on', { date: formatDateTime(cutoverAt) }))
  })

  it('tells nothing while the cutover date is unknown', () => {
    expect(mountComposableWithI18n(useV2vReviewLabels).getCutoverLabel(undefined)).toBeUndefined()
  })
})

describe('getNewVmsSummary', () => {
  it('names the VMs, then the SRs they go to', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getNewVmsSummary(['app-03', 'build-02'], ['sr-nvme-01', 'sr-hdd-02'])).toBe(
      labels.t('source-to-destination', { source: 'app-03, build-02', destination: 'sr-nvme-01, sr-hdd-02' })
    )
  })

  it('only names the VMs while their SRs are unknown', () => {
    expect(mountComposableWithI18n(useV2vReviewLabels).getNewVmsSummary(['app-03', 'build-02'], undefined)).toBe(
      'app-03, build-02'
    )
  })
})

describe('getStartProblemLabel', () => {
  it('names the VM of the problem', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getStartProblemLabel('RDM disk', 'web-01')).toBe(
      labels.t('v2v:vm-start-problem', { vm: 'web-01', message: 'RDM disk' })
    )
  })

  it('only tells a problem of the whole launch', () => {
    expect(mountComposableWithI18n(useV2vReviewLabels).getStartProblemLabel('tags are not supported', undefined)).toBe(
      'tags are not supported'
    )
  })
})

describe('getLaunchOptionLabel', () => {
  it.each([
    [true, 'option-on'],
    [false, 'option-off'],
  ] as const)('tells a launch option set to %s', (value, labelKey) => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getLaunchOptionLabel(value, !value)).toBe(labels.t(labelKey))
  })

  it.each([
    [true, 'option-on'],
    [false, 'option-off'],
  ] as const)('reads a launch option left to its default of %s as that default', (defaultValue, labelKey) => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getLaunchOptionLabel(undefined, defaultValue)).toBe(
      labels.t('default-value', { value: labels.t(labelKey) })
    )
  })
})
