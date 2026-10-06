import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({
    getVbdsByIds: () => [],
    useGetVbdsByIds: () => computed(() => []),
  })) as unknown as typeof useXoVbdCollection,
}))

// Only reached through the row actions' migration form and task monitoring, which no test opens
vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: computed(() => []),
    useGetSrById: () => computed(() => undefined),
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    pbdsBySr: computed(() => new Map()),
    getPbdsByIds: () => [],
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({
    useGetTaskById: () => computed(() => undefined),
  })) as unknown as typeof useXoTaskCollection,
}))

function findVdiHrefs(vm?: FrontXoVm) {
  const wrapper = mount(VdisTable, {
    props: { vdis: [createVdi({ id: 'vdi-42' as FrontXoVdi['id'] })], vm },
    global: createGlobalTestConfig(),
  })

  return wrapper.findAll('.vts-link-cell a').map(link => link.attributes('href'))
}

it('links each VDI to its page opened from a VM when a VM is given', () => {
  expect(findVdiHrefs(createVm())).toEqual(['/vdi/vdi-42/general?from=vm'])
})

it('links each VDI to its page opened from an SR when no VM is given', () => {
  expect(findVdiHrefs()).toEqual(['/vdi/vdi-42/general?from=sr'])
})
