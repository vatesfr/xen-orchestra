import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createHost } from '@/test/create-host.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSr } from '@/test/create-sr.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const HOST = createHost({ name_label: 'Host A' })
const LOCAL_SR = createSr({ shared: false })
const PBD_ON_UNKNOWN_HOST = createPbd({ SR: LOCAL_SR.id, host: 'unknown-host' as FrontXoHost['id'] })

beforeEach(() => {
  destinationCollectionsMock.reset()
  destinationCollectionsMock.hosts.value = [HOST]
})

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

describe('getSrLocation', () => {
  it('locates a local SR on the first known host of its PBDs', () => {
    destinationCollectionsMock.pbds.value = [PBD_ON_UNKNOWN_HOST, createPbd({ SR: LOCAL_SR.id, host: HOST.id })]

    const { getSrLocation } = mountComposableWithI18n(() => useXoSrUtils())

    expect(getSrLocation(LOCAL_SR)).toBe(HOST.name_label)
  })

  it.each([
    ['it has no PBD', []],
    ['the host of its PBD is unknown', [PBD_ON_UNKNOWN_HOST]],
  ])('reads unknown for a local SR when %s', (_, pbds) => {
    destinationCollectionsMock.pbds.value = pbds

    const { getSrLocation, t } = mountComposableWithI18n(() => useXoSrUtils())

    expect(getSrLocation(LOCAL_SR)).toBe(t('unknown'))
  })
})
