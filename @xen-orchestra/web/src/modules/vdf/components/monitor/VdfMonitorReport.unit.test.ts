import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfMonitorReport from '@/modules/vdf/components/monitor/VdfMonitorReport.vue'
import type { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import type { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import type { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import type { useVdfMonitorExpected } from '@/modules/vdf/composables/vdf-monitor-expected.composable.ts'
import type { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import type { useVdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import type { useVdfMonitor } from '@/modules/vdf/remote-resources/use-vdf-monitor.ts'
import type { VdfDocument, VdfMonitorEntry } from '@/modules/vdf/types.ts'
import type { VdfMonitorShadow } from '@/modules/vdf/utils/vdf-shadow.util.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// vdf#86: the Monitor tab keeps what a policy alone would drop (agents'
// "alone" entries) out of the main report and suggestions, in a section of
// its own, and says the agents cover a same-tier shadow when they do

const { data } = vi.hoisted(() => ({
  data: {
    entries: [] as VdfMonitorEntry[],
    hosts: [] as FrontXoHost[],
    shadows: [] as VdfMonitorShadow[],
  },
}))

const DOCUMENT: VdfDocument = {
  groups: { web: { tags: ['web'] }, cache: { tags: ['cache'] } },
  policies: [
    { name: 'web', appliedTo: 'web', default: 'drop', ingress: [{ id: 1, from: 'any', proto: 'tcp', ports: [80] }] },
    { name: 'cache', appliedTo: 'cache', mode: 'monitor', default: 'drop', ingress: [] },
  ],
}

const VM = createVm({ id: 'vm-cache' as FrontXoVm['id'], $pool: 'pool-1' as FrontXoVm['$pool'] })

vi.mock(import('@/modules/vdf/remote-resources/use-vdf-monitor.ts'), () => ({
  useVdfMonitor: (() => ({
    monitor: ref({ entries: data.entries, errors: [] }),
    isMonitorReady: ref(true),
    hasMonitorError: ref(false),
    monitorError: ref(undefined),
  })) as unknown as typeof useVdfMonitor,
}))
vi.mock(import('@/modules/vdf/composables/vdf-scope.composable.ts'), () => ({
  useVdfScope: (() => ({
    document: computed(() => DOCUMENT),
    publishedDocument: computed(() => DOCUMENT),
    saveRule: vi.fn(),
  })) as unknown as typeof useVdfScope,
}))
vi.mock(import('@/modules/vdf/composables/vdf-ip-names.composable.ts'), () => ({
  useVdfIpNames: (() => ({ vmByIp: ref(new Map()), groupsOfIp: () => [] })) as unknown as typeof useVdfIpNames,
}))
vi.mock(import('@/modules/vdf/composables/vdf-interfaces.composable.ts'), () => ({
  useVdfInterfaces: (() => ({
    netTagsOfAddress: () => undefined,
    interfaceLabel: () => undefined,
    vifLabel: () => undefined,
    interfacesOf: () => [],
  })) as unknown as typeof useVdfInterfaces,
}))
vi.mock(import('@/modules/vdf/composables/vdf-members.composable.ts'), () => ({
  useVdfMembers: (() => ({ membersOf: () => [] })) as unknown as typeof useVdfMembers,
}))
vi.mock(import('@/modules/vdf/composables/vdf-monitor-expected.composable.ts'), () => ({
  useVdfMonitorExpected: (() => ({
    isExpected: () => false,
    setExpected: vi.fn(),
  })) as unknown as typeof useVdfMonitorExpected,
}))
vi.mock(import('@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'), () => ({
  useVdfMonitorShadows: (() => ({
    shadowsIn: () => data.shadows,
    shadowText: (shadow: VdfMonitorShadow) => `blind:${shadow.policy}`,
    coveredShadowText: (shadow: VdfMonitorShadow) => `covered:${shadow.policy}`,
  })) as unknown as typeof useVdfMonitorShadows,
}))
vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: ref([VM]) })) as unknown as typeof useXoVmCollection,
}))
vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ hosts: ref(data.hosts) })) as unknown as typeof useXoHostCollection,
}))

const entry = (fields: Partial<VdfMonitorEntry>): VdfMonitorEntry => ({
  src: '10.0.0.7',
  vm: 'vm-cache',
  vmName: 'cache',
  proto: 'tcp',
  port: 9100,
  policy: 'cache',
  tier: 'application',
  count: 1,
  first: '2026-10-27T10:00:00Z',
  last: '2026-10-27T10:00:00Z',
  ...fields,
})

const SHADOW: VdfMonitorShadow = {
  policy: 'cache',
  by: 'web',
  byMonitored: false,
  tier: 100,
  sameTier: true,
  kind: 'default',
  byDefault: 'drop',
  vms: [{ id: 'vm-cache', name: 'cache' }],
}

// the VM's host, its agent reporting the policy shadowed (shadowedBy), or
// an older agent (none)
function withHost(shadowedBy?: string[]) {
  const policies = [{ name: 'cache', tier: 'application', vifs: 1, realized: true, monitorShadowed: 1, shadowedBy }]

  data.hosts = [createHost({ otherConfig: { 'vdf:status': JSON.stringify({ policies }) } })]
}

async function mountReport() {
  const wrapper = mount(VdfMonitorReport, {
    props: { pool: { id: 'pool-1' } as FrontXoPool },
    global: createGlobalTestConfig(),
  })

  await flushPromises()

  return wrapper
}

beforeEach(() => {
  data.entries = [entry({}), entry({ port: 6379, alone: true, shadowedBy: ['web'], count: 4 })]
  data.shadows = []
  withHost(['web'])
})

it('keeps the alone entries out of the report and its suggestions, in their own section', async () => {
  const wrapper = await mountReport()
  const sections = wrapper.findAll('section.suggestions')
  const alone = wrapper.get('section.alone')

  expect(sections).toHaveLength(2)
  // the main suggestions: what enforcing breaks now
  expect(sections[0].classes()).not.toContain('alone')
  expect(sections[0].text()).toContain('TCP 9100')
  expect(sections[0].text()).not.toContain('6379')
  // the alone section: its own suggestion and flow
  expect(alone.text()).toContain(t('firewall:monitor:alone:title', { policy: 'cache', by: 'web' }))
  expect(alone.text()).toContain('TCP 6379')
  expect(alone.findAll('.alone-flow')).toHaveLength(1)
  // the table: the flow of now only
  expect(wrapper.findAll('tbody tr')).toHaveLength(1)
})

// agents since 8767985: a section per shadowed tier; a later tier's policy
// reached once an earlier tier's enforced policies no longer decide first
it('gives each shadowed tier its section, an earlier one said', async () => {
  data.entries = [
    entry({ port: 6379, alone: true, shadowedBy: ['web'], shadowedTier: 'application' }),
    entry({ port: 6380, alone: true, shadowedBy: ['e25'], shadowedTier: 'securityops' }),
  ]
  const wrapper = await mountReport()
  const sections = wrapper.findAll('section.alone')

  expect(sections).toHaveLength(2)
  expect(sections[0].text()).toContain(t('firewall:monitor:alone:title', { policy: 'cache', by: 'web' }))
  expect(sections[1].text()).toContain(
    t('firewall:monitor:alone:title:earlier', { policy: 'cache', by: 'e25', tier: t('firewall:tier:securityops') })
  )
  expect(sections[1].text()).toContain('TCP 6380')
})

it('an older agent: no alone entries, no section', async () => {
  data.entries = [entry({})]
  const wrapper = await mountReport()

  expect(wrapper.find('section.alone').exists()).toBe(false)
  expect(wrapper.findAll('section.suggestions')).toHaveLength(1)
})

it('says the agents cover a same-tier shadow, else warns as before', async () => {
  data.shadows = [SHADOW]
  const covered = await mountReport()

  expect(covered.text()).toContain('covered:cache')
  expect(covered.text()).not.toContain('blind:cache')

  // an older agent on the VM's host: XO's own warning
  withHost(undefined)
  const blind = await mountReport()

  expect(blind.text()).toContain('blind:cache')
  expect(blind.text()).not.toContain('covered:cache')
})
