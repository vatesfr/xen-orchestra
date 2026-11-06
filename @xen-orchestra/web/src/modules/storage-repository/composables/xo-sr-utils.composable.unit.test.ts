import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
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

describe('getSrSelectLabel', () => {
  it.each([
    ['the whole GB left', createSr({ shared: true, size: 10 * ONE_GB, physical_usage: 1.5 * ONE_GB }), 8],
    [
      'no GB left once it uses more than its size',
      createSr({ shared: true, size: 10 * ONE_GB, physical_usage: 20 * ONE_GB }),
      0,
    ],
  ])('labels the SR with its location and %s', (_, sr, gbLeft) => {
    const { getSrSelectLabel, t } = mountComposableWithI18n(() => useXoSrUtils())

    expect(getSrSelectLabel(sr)).toBe(`${sr.name_label} (${t('shared')}) - ${t('n-gb-left', { n: gbLeft })}`)
  })
})
