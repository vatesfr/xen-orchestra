import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { formatDateTime } from '@core/utils/time.util.ts'

const SR_NAMES = ['sr-nvme-01', 'sr-ssd-01']

describe('launchGroupHeadings', () => {
  it.each([
    ['excluded', 'v2v:launch-group:excluded', 'danger'],
    ['migrated', 'v2v:launch-group:migrated', 'warning'],
    ['resumed', 'v2v:launch-group:resumed', 'brand'],
    ['new', 'v2v:launch-group:new', 'success'],
  ] as const)('heads the %s group with its label and accent', (type, labelKey, accent) => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.launchGroupHeadings[type]).toEqual({ label: labels.t(labelKey), accent })
  })
})

describe('getReviewSummaryParts', () => {
  it.each([
    {
      case: 'counts the VMs of the list, then the excluded ones and those to confirm',
      counts: { excluded: 2, unconfirmed: 1 },
      countKeys: [
        ['v2v:n-excluded', 2],
        ['n-need-confirmation', 1],
      ] as const,
    },
    { case: 'leaves out the counts at zero', counts: { excluded: 0, unconfirmed: 0 }, countKeys: [] },
  ])('names the destination pool and $case', ({ counts, countKeys }) => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getReviewSummaryParts(DISKOR_POOL_NAME, 7, counts)).toEqual([
      labels.t('destination-pool-named', { name: DISKOR_POOL_NAME }),
      labels.t('n-vms-in-list', { n: 7 }),
      ...countKeys.map(([key, n]) => labels.t(key, { n })),
    ])
  })
})

describe('getSrNamesLabel', () => {
  it('lists the SR names', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getSrNamesLabel(SR_NAMES)).toBe('sr-nvme-01, sr-ssd-01')
  })
})

describe('getResumedVmParts', () => {
  it('tells the transfer of the VM, the pool and the SRs it continues on, and that its mapping is kept', () => {
    const labels = mountComposableWithI18n(useV2vReviewLabels)

    expect(labels.getResumedVmParts('full', DISKOR_POOL_NAME, SR_NAMES)).toEqual([
      labels.t('full-transfer'),
      labels.t('v2v:continues-on-pool-sr', { pool: DISKOR_POOL_NAME, srs: labels.getSrNamesLabel(SR_NAMES) }),
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
