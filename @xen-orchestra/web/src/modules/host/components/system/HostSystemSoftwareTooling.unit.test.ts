import HostSystemSoftwareTooling from '@/modules/host/components/system/HostSystemSoftwareTooling.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findTitleText } from '@/test/find-card-heading.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { relativeTime, t } from '@/test/i18n.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountSoftwareTooling(host: FrontXoHost = createHost()) {
  return mount(HostSystemSoftwareTooling, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountSoftwareTooling()

  expect(findTitleText(wrapper)).toBe(t('software-tooling'))
})

it('shows the version and the build the host runs', () => {
  const wrapper = mountSoftwareTooling(createHost({ version: '8.3.0', build: 'release/yangtze/master/58' }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('version')]: '8.3.0',
    [t('build-number')]: 'release/yangtze/master/58',
  })
})

it('reports how long ago the toolstack of a running host started, reading it as seconds', () => {
  const agentStartTimeInSeconds = 1660000000

  const wrapper = mountSoftwareTooling(
    createHost({ power_state: HOST_POWER_STATE.RUNNING, agentStartTime: agentStartTimeInSeconds })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('toolstack-uptime')]: relativeTime(agentStartTimeInSeconds * 1000),
  })
})

it('leaves the toolstack uptime empty for a halted host', () => {
  const wrapper = mountSoftwareTooling(createHost({ power_state: HOST_POWER_STATE.HALTED }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('toolstack-uptime')]: '' })
})
