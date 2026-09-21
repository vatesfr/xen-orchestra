import HostSystemNetworking from '@/modules/host/components/system/HostSystemNetworking.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findTitleText } from '@/test/find-card-heading.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountNetworking(host: FrontXoHost = createHost()) {
  return mount(HostSystemNetworking, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountNetworking()

  expect(findTitleText(wrapper)).toBe(t('networking'))
})

it('shows how the host is reached on the network', () => {
  const wrapper = mountNetworking(
    createHost({
      address: '10.0.0.4',
      logging: { syslog_destination: 'syslog.example.com' },
      iscsiIqn: 'iqn.2024-01.com.example:host-1',
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('ip-address')]: '10.0.0.4',
    [t('remote-syslog')]: 'syslog.example.com',
    [t('iscsi-iqn')]: 'iqn.2024-01.com.example:host-1',
  })
})

it('leaves the remote syslog and the iSCSI IQN empty when the host reports neither', () => {
  const wrapper = mountNetworking(createHost({ logging: {}, iscsiIqn: '' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('remote-syslog')]: '', [t('iscsi-iqn')]: '' })
})

it('shows multi-pathing as enabled when the host has it on', () => {
  const wrapper = mountNetworking(createHost({ multipathing: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('multi-pathing')]: t('enabled') })
})

it('shows multi-pathing as disabled when the host has it off', () => {
  const wrapper = mountNetworking(createHost({ multipathing: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('multi-pathing')]: t('disabled') })
})
