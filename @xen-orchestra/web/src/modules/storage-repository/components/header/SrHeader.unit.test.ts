import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import SrHeader from '@/modules/storage-repository/components/header/SrHeader.vue'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { findTabs } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ isDefaultSr: () => false })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    arePbdsReady: computed(() => true),
    getPbdsByIds: () => [],
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    useGetHostById: () => computed(() => undefined),
  })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    useGetPoolById: () => computed(() => undefined),
  })) as unknown as typeof useXoPoolCollection,
}))

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
