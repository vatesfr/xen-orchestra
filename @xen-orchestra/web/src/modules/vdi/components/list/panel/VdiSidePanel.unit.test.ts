import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
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
})

// The buttons and cards are covered by their own tests: this one only asserts which connection action is offered
function mountSidePanel(vm: FrontXoVm | undefined, vbd: FrontXoVbd) {
  useGetVbdsByIds.mockReturnValue(computed(() => [vbd]))

  const wrapper = mount(VdiSidePanel, {
    props: { vdi: createVdi(), vm },
    global: {
      ...createGlobalTestConfig(),
      stubs: {
        VbdConnectButton: true,
        VbdDisconnectButton: true,
        VdiActions: true,
        VdiInfosCard: true,
        VdiSpaceCard: true,
        VdiConfigurationCard: true,
      },
    },
  })

  return {
    offersConnect: wrapper.findComponent(VbdConnectButton).exists(),
    offersDisconnect: wrapper.findComponent(VbdDisconnectButton).exists(),
  }
}

it('offers to connect the VDI while it is disconnected from the VM', () => {
  expect(mountSidePanel(createVm(), createVbd({ attached: false }))).toEqual({
    offersConnect: true,
    offersDisconnect: false,
  })
})

it('offers to disconnect the VDI while it is connected to the VM', () => {
  expect(mountSidePanel(createVm(), createVbd({ attached: true }))).toEqual({
    offersConnect: false,
    offersDisconnect: true,
  })
})

it('offers no connection action when no VM is given', () => {
  expect(mountSidePanel(undefined, createVbd({ attached: false }))).toEqual({
    offersConnect: false,
    offersDisconnect: false,
  })
})
