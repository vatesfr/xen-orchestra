import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

function mountSrUtils() {
  return mountComposableWithI18n(() => useXoSrUtils())
}

describe('getSrOptionLabel', () => {
  it.each([
    [
      'its free space, rounded down to the GB',
      createSr({ shared: true, size: 10 * ONE_GB, physical_usage: ONE_GB + 1 }),
      8,
    ],
    ['no free space once it uses more than its size', createSr({ shared: true, physical_usage: 20 * ONE_GB }), 0],
  ])('labels an SR with its location and %s', (_, sr: FrontXoSr, gbLeft) => {
    const result = mountSrUtils()

    expect(result.getSrOptionLabel(sr)).toBe(
      `${sr.name_label} (${result.t('shared')}) - ${result.t('n-gb-left', { n: gbLeft })}`
    )
  })
})
