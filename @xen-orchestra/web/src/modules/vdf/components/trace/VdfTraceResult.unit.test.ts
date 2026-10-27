import VdfTraceResult from '@/modules/vdf/components/trace/VdfTraceResult.vue'
import type { VdfTraceResult as Result, VdfTraceWhatIf } from '@/modules/vdf/types.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// monitor mode's what-if passes on a hop (vdf#13), the isolated pass of a
// policy as if alone in its tier (vdf#86) apart

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: ref([]) })) as unknown as typeof useXoVmCollection,
}))

const whatIf = (fields: Partial<VdfTraceWhatIf>): VdfTraceWhatIf => ({
  policies: ['cache'],
  verdict: 'would-allow',
  recorded: false,
  text: 'allowed with the monitored policies enforced',
  ...fields,
})

function mountResult(monitor?: VdfTraceWhatIf[]) {
  const result: Result = {
    from: { spec: '10.0.0.7', ip: '10.0.0.7', external: true },
    to: { spec: 'vm-cache', vm: 'cache', uuid: 'vm-cache', ip: '10.0.0.5' },
    proto: 'tcp',
    port: 6379,
    state: 'new',
    allowed: true,
    summary: 'ALLOWED',
    hops: [
      {
        host: 'host-a',
        side: 'destination',
        bridge: 'xenbr0',
        packet: 'tcp',
        conntrack: 'new',
        stages: [],
        datapath_actions: 'output:3',
        delivered: true,
        policy_allowed: true,
        monitor,
      },
    ],
  }

  return mount(VdfTraceResult, {
    props: { poolId: 'pool-1', result, document: { groups: {}, policies: [] } },
    global: createGlobalTestConfig(),
  })
}

it('shows the what-if pass, and the isolated pass apart', () => {
  const wrapper = mountResult([
    whatIf({}),
    whatIf({
      alone: true,
      shadowedBy: ['web'],
      verdict: 'would-drop',
      recorded: true,
      text: 'dropped by cache (default)',
    }),
  ])
  const passes = wrapper.findAll('.monitor .what-if')

  expect(wrapper.get('.monitor').text()).toContain(t('firewall:trace:monitor'))
  expect(passes).toHaveLength(2)
  expect(passes[0].classes()).not.toContain('alone')
  expect(passes[0].text()).toContain(t('firewall:trace:monitor:ingress'))
  expect(passes[1].classes()).toContain('alone')
  expect(passes[1].text()).toContain(t('firewall:trace:monitor:alone', { by: 'web' }))
  expect(passes[1].text()).toContain('dropped by cache (default)')
  expect(passes[1].text()).toContain(t('firewall:trace:monitor:recorded'))
})

it('an older agent: no monitor, nothing shown', () => {
  expect(mountResult().find('.monitor').exists()).toBe(false)
})
