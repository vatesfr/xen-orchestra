import HostSystemNetworking from '@/modules/host/components/system/HostSystemNetworking.vue'
import { createHost } from '@/test/create-host.ts'
import { findCopiedValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

it('offers to copy the IP address and the iSCSI IQN of the host', () => {
  const wrapper = mount(HostSystemNetworking, {
    props: { host: createHost({ address: '10.0.0.1', iscsiIqn: 'iqn.2024-01.com.example:host-42' }) },
    global: createGlobalTestConfig(),
  })

  expect(findCopiedValues(wrapper)).toEqual({
    [t('ip-address')]: '10.0.0.1',
    [t('iscsi-iqn')]: 'iqn.2024-01.com.example:host-42',
  })
})
