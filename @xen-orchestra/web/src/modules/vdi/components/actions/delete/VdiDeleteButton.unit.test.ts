import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetVbdsByIds } = vi.hoisted(() => ({
  useGetVbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

beforeEach(() => {
  useGetVbdsByIds.mockReset()
  useGetVbdsByIds.mockReturnValue(computed(() => []))
})

function mountDeleteButton(vm?: FrontXoVm, ...vbds: FrontXoVbd[]) {
  useGetVbdsByIds.mockReturnValue(computed(() => vbds))

  return mount(VdiDeleteButton, {
    props: { vdi: createVdi(), vm },
    global: createGlobalTestConfig(),
  })
}

it('is enabled, with no hint, while no VM has the VDI attached', () => {
  const wrapper = mountDeleteButton(createVm(), createVbd({ attached: false }))

  expect(wrapper.get('.menu-trigger').classes()).not.toContain('disabled')
  expect(wrapper.find('i').exists()).toBe(false)
})

it('is disabled and says the VM is running while the VDI is attached to it', () => {
  const wrapper = mountDeleteButton(
    createVm({ id: 'vm-123' as FrontXoVm['id'] }),
    createVbd({ VM: 'vm-123' as FrontXoVbd['VM'], attached: true })
  )

  expect(wrapper.get('.menu-trigger').classes()).toContain('disabled')
  expect(wrapper.get('i').text()).toBe(t('vm-running'))
})

it('is disabled and says the VDI is in use while another VM has it attached', () => {
  const wrapper = mountDeleteButton(undefined, createVbd({ VM: 'vm-other' as FrontXoVbd['VM'], attached: true }))

  expect(wrapper.get('.menu-trigger').classes()).toContain('disabled')
  expect(wrapper.get('i').text()).toBe(t('vdi-in-use'))
})
