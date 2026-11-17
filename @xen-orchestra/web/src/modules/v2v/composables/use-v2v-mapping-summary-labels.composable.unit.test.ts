import { useV2vMappingSummaryLabels } from '@/modules/v2v/composables/use-v2v-mapping-summary-labels.composable.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

describe('getResumedParts', () => {
  it.each([
    ['delta', 'v2v:delta-from-last-sync'],
    ['full', 'full-transfer'],
  ] as const)('tells the %s transfer, then the details, then that the mapping is locked', (transfer, labelKey) => {
    const labels = mountComposableWithI18n(useV2vMappingSummaryLabels)

    expect(labels.getResumedParts(transfer, 'detail-1', 'detail-2')).toEqual([
      labels.t(labelKey),
      'detail-1',
      'detail-2',
      labels.t('v2v:mapping-locked'),
    ])
  })

  it('tells only the transfer and the locked mapping without details', () => {
    const labels = mountComposableWithI18n(useV2vMappingSummaryLabels)

    expect(labels.getResumedParts('delta')).toEqual([
      labels.t('v2v:delta-from-last-sync'),
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
