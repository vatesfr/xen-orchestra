import HostMainActions from '@/modules/host/components/actions/HostMainActions.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { t } from '@/test/i18n.ts'
import { itCompactsMainActions } from '@/test/main-actions.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { taskCollectionMock, mockXoTaskCollection } from '@/test/mock-xo-task-collection.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'

mockXoCollections('host', 'pool')

mockXoTaskCollection()

mockXoVmCollection()

beforeEach(() => {
  xoCollectionsMock.reset()
  taskCollectionMock.reset()
  vmCollectionMock.reset()
})

itCompactsMainActions(HostMainActions, {
  props: () => ({ host: createHost({ id: 'host-42' as FrontXoHost['id'] }) }),
  otherMenuItem: t('action:restart-toolstack'),
})
