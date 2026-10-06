import HostSystemGeneralInformation from '@/modules/host/components/system/HostSystemGeneralInformation.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findCopiedValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    useGetPoolById: () => computed(() => undefined),
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    getMasterHostByPoolId: () => undefined,
    isMasterHost: () => false,
  })) as unknown as typeof useXoHostCollection,
}))

it('offers to copy the name and the UUID of the host', () => {
  const wrapper = mount(HostSystemGeneralInformation, {
    props: { host: createHost({ name_label: 'Primary Host', id: 'host-42' as FrontXoHost['id'] }) },
    global: createGlobalTestConfig(),
  })

  expect(findCopiedValues(wrapper)).toEqual({ [t('name')]: 'Primary Host', [t('uuid')]: 'host-42' })
})
