import SrHeader from '@/modules/storage-repository/components/header/SrHeader.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { findTabs } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'pbd', 'pool', 'sr')

beforeEach(() => {
  xoCollectionsMock.reset()
})

const poolScope: SrScope = { type: SR_SCOPE_TYPE.POOL }

async function mountHeader(scope: SrScope = poolScope, initialPath?: string) {
  const router = createTestRouter()

  if (initialPath !== undefined) {
    await router.push(initialPath)
  }

  return mount(SrHeader, {
    props: { sr: createSr({ id: 'sr-42' as FrontXoSr['id'] }), scope },
    global: createGlobalTestConfig({ router }),
  })
}

it('lists every tab of the SR, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.text())).toEqual([t('general'), t('hosts'), t('vdis')])
})

it('points every tab at the page of that SR, keeping the pool scope', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.attributes('href'))).toEqual([
    '/sr/sr-42/general?from=pool',
    '/sr/sr-42/hosts?from=pool',
    '/sr/sr-42/vdis?from=pool',
  ])
})

it('keeps the host scope on every tab', async () => {
  const wrapper = await mountHeader({ type: SR_SCOPE_TYPE.HOST, hostId: 'host-7' })

  expect(findTabs(wrapper).map(tab => tab.attributes('href'))).toEqual([
    '/sr/sr-42/general?from=host&host=host-7',
    '/sr/sr-42/hosts?from=host&host=host-7',
    '/sr/sr-42/vdis?from=host&host=host-7',
  ])
})

it('marks the VDIs tab as active on the VDIs page of the SR', async () => {
  const wrapper = await mountHeader(poolScope, '/sr/sr-42/vdis')

  const activeTabs = findTabs(wrapper)
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())

  expect(activeTabs).toEqual([t('vdis')])
})
