import PoolSystemConnections from '@/modules/pool/components/system/PoolSystemConnections.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createServer } from '@/test/create-server.ts'
import { findCopiedValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const pool = createPool({ id: 'pool-42' as FrontXoPool['id'] })

vi.mock(import('@/modules/server/remote-resources/use-xo-server-collection.ts'), () => ({
  useXoServerCollection: (() => ({
    serverByPool: ref(new Map([[pool.id, [createServer({ host: '10.0.0.1' })]]])),
    areServersReady: ref(true),
  })) as unknown as typeof useXoServerCollection,
}))

it('offers to copy the IP address of the server', () => {
  const wrapper = mount(PoolSystemConnections, { props: { pool }, global: createGlobalTestConfig() })

  expect(findCopiedValues(wrapper)).toEqual({ [t('ip-address')]: '10.0.0.1' })
})
