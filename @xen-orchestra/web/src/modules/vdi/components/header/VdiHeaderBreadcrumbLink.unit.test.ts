import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdiHeaderBreadcrumbLink from '@/modules/vdi/components/header/VdiHeaderBreadcrumbLink.vue'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findBreadcrumbItems } from '@/test/find-header.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'pbd', 'pool', 'sr')

beforeEach(() => {
  xoCollectionsMock.reset()
})

const pool = createPool({ id: 'pool-1' as FrontXoPool['id'], name_label: 'Production' })

// A VDI page opened from the VDIs tab of an SR of `pool`, whose PBD is attached
function mountFromSr() {
  const pbd = createPbd({ id: 'pbd-1' as FrontXoPbd['id'], SR: 'sr-42' as FrontXoPbd['SR'], attached: true })
  const sr = createSr({ id: 'sr-42' as FrontXoSr['id'], name_label: 'Local storage', $pool: pool.id, $PBDs: [pbd.id] })

  xoCollectionsMock.pools.value = [pool]
  xoCollectionsMock.pbds.value = [pbd]

  return mount(VdiHeaderBreadcrumbLink, {
    props: { sr, vdi: createVdi({ name_label: 'System disk' }), fromContext: VDI_PAGE_CONTEXT.SR },
    global: createGlobalTestConfig({ router: createTestRouter() }),
  })
}

// The breadcrumb link of the SR of `mountFromSr`
function findSrLink(wrapper: ReturnType<typeof mountFromSr>) {
  return wrapper.findAllComponents(UiLink).find(link => link.text() === 'Local storage')
}

describe('from an SR', () => {
  it('lists the pool, its storage, the SR then the VDI', () => {
    expect(findBreadcrumbItems(mountFromSr()).map(item => item.text())).toEqual([
      'Production',
      t('storage'),
      'Local storage',
      'System disk',
    ])
  })

  it('links the SR to its VDIs tab, in the scope of its pool', () => {
    const srLink = findSrLink(mountFromSr())

    expect(srLink?.attributes('href')).toBe('/sr/sr-42/vdis?from=pool')
  })

  it('shows the SR with the icon of its connection status', () => {
    const srLink = findSrLink(mountFromSr())

    expect(srLink?.props('icon')).toBe(objectIcon('sr', 'connected'))
  })
})
