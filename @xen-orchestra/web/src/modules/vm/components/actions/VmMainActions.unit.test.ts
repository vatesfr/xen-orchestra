import VmMainActions from '@/modules/vm/components/actions/VmMainActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { itCompactsMainActions } from '@/test/main-actions.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { taskCollectionMock, mockXoTaskCollection } from '@/test/mock-xo-task-collection.ts'

mockXoRoutes()

mockXoCollections('host')

mockXoTaskCollection()

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
})

itCompactsMainActions(VmMainActions, {
  props: () => ({ vm: createVm({ id: 'vm-42' as FrontXoVm['id'] }) }),
})
