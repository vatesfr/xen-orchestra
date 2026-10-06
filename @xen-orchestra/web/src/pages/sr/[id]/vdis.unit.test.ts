import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import SrVdisPage from '@/pages/sr/[id]/vdis.vue'
import { createSr } from '@/test/create-sr.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetVdisByIds } = vi.hoisted(() => ({
  useGetVdisByIds: vi.fn(),
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({
    useGetVdisByIds,
    areVdisReady: computed(() => true),
    hasVdiFetchError: computed(() => false),
  })) as unknown as typeof useXoVdiCollection,
}))

beforeEach(() => {
  useGetVdisByIds.mockReset()
  useGetVdisByIds.mockReturnValue(
    computed(() => [createVdi({ id: 'vdi-1' as FrontXoVdi['id'] }), createVdi({ id: 'vdi-2' as FrontXoVdi['id'] })])
  )
})

async function mountPage(path = '/sr/sr-42/vdis') {
  const router = createTestRouter()

  await router.push(path)

  return mount(SrVdisPage, {
    props: { sr: createSr({ id: 'sr-42' as FrontXoSr['id'] }) },
    global: { ...createGlobalTestConfig({ router }), stubs: { VdisTable: true, VdiSidePanel: true } },
  })
}

it('renders the VDI table, then the VDI side panel', async () => {
  const wrapper = await mountPage()

  expect(wrapper.findAll('vdis-table-stub, vdi-side-panel-stub').map(stub => stub.element.localName)).toEqual([
    'vdis-table-stub',
    'vdi-side-panel-stub',
  ])
})

it('opens the side panel on the VDI selected in the route', async () => {
  const wrapper = await mountPage('/sr/sr-42/vdis?id=vdi-2')

  expect(wrapper.getComponent(VdiSidePanel).props('vdi')?.id).toBe('vdi-2')
})

it('clears the selection when the side panel is closed', async () => {
  const wrapper = await mountPage('/sr/sr-42/vdis?id=vdi-2')

  wrapper.getComponent(VdiSidePanel).vm.$emit('close')
  await flushPromises()

  expect(wrapper.getComponent(VdiSidePanel).props('vdi')).toBeUndefined()
})
