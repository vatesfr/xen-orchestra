import { findLegends } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { findProgressBarFills } from '@core-test/find-progress-bars.ts'
import type { VueWrapper } from '@vue/test-utils'

/**
 * Registers the tests of the progress bar every CPU provisioning card shares, mounted by `mountCard` with 75% of its
 * CPUs assigned: its fill, then its legend. `names` holds the name of each test.
 */
export function itShowsCpuProvisioningShare(mountCard: () => VueWrapper, names: { fill: string; legend: string }) {
  it(names.fill, () => {
    expect(findProgressBarFills(mountCard())).toEqual(['75%'])
  })

  it(names.legend, () => {
    expect(findLegends(mountCard())).toEqual([[t('vcpus'), '75%']])
  })
}
