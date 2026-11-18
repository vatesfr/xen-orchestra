import { useV2vMappingSummaryLabels } from '@/modules/v2v/composables/use-v2v-mapping-summary-labels.composable.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

describe('getResumedParts', () => {
  it.each([
    ['with details', ['detail-1', 'detail-2']],
    ['without details', []],
  ])('tells the resume, then the details, then that the mapping is locked %s', (_, details) => {
    const labels = mountComposableWithI18n(useV2vMappingSummaryLabels)

    expect(labels.getResumedParts(...details)).toEqual([
      labels.t('v2v:resumes-from-last-sync'),
      ...details,
      labels.t('v2v:mapping-locked'),
    ])
  })
})

describe('withTargets', () => {
  it('points the count to its targets', () => {
    const labels = mountComposableWithI18n(useV2vMappingSummaryLabels)

    expect(labels.withTargets('2 disks', ['sr-nvme-01', 'sr-ssd-01'])).toBe(
      labels.t('source-to-destination', { source: '2 disks', destination: 'sr-nvme-01, sr-ssd-01' })
    )
  })

  it('only tells the count while its targets are unknown', () => {
    expect(mountComposableWithI18n(useV2vMappingSummaryLabels).withTargets('2 disks', undefined)).toBe('2 disks')
  })
})
