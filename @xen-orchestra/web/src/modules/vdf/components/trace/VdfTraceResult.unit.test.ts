import VdfTraceResult from '@/modules/vdf/components/trace/VdfTraceResult.vue'
import type { VdfTraceResult as Result, VdfTraceStage, VdfTraceWhatIf } from '@/modules/vdf/types.ts'
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

function mountResult(monitor?: VdfTraceWhatIf[], stages: VdfTraceStage[] = []) {
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
        stages,
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

// agents since 8767985: one isolated pass per shadowed tier, each after
// the pass it forks from, its tier said
it('shows each isolated pass with its shadowed tier', () => {
  const wrapper = mountResult([
    whatIf({}),
    whatIf({ alone: true, shadowedBy: ['e25'], shadowedTier: 25, verdict: 'would-drop' }),
    whatIf({ alone: true, shadowedBy: ['web'], shadowedTier: 100, verdict: 'would-allow' }),
  ])
  const passes = wrapper.findAll('.monitor .what-if')

  expect(passes.map(pass => pass.classes().includes('alone'))).toEqual([false, true, true])
  expect(passes[1].text()).toContain(
    t('firewall:trace:monitor:alone:tier', { by: 'e25', tier: t('firewall:tier:securityops') })
  )
  expect(passes[2].text()).toContain(
    t('firewall:trace:monitor:alone:tier', { by: 'web', tier: t('firewall:tier:application') })
  )
})

// the what-if pass: shadowed tiers past the agent's cap, no isolated pass
it('says which shadowed tiers a pass left unchecked', () => {
  const wrapper = mountResult([whatIf({ unchecked: [25, 75] })])

  expect(wrapper.get('.monitor .unchecked').text()).toContain(
    t('firewall:trace:monitor:unchecked', {
      tiers: `${t('firewall:tier:securityops')} and ${t('firewall:tier:platform')}`,
    })
  )
  expect(
    mountResult([whatIf({})])
      .find('.monitor .unchecked')
      .exists()
  ).toBe(false)
})

it('an older agent: no monitor, nothing shown', () => {
  expect(mountResult().find('.monitor').exists()).toBe(false)
})

// UX P2-6: the steps that decide; the agent's plumbing on demand
it('lists the steps that decide, the others behind "Show all steps"', async () => {
  const stage = (fields: Partial<VdfTraceStage>): VdfTraceStage => ({
    table: 2,
    priority: 100,
    match: '',
    vdf: true,
    kind: 'step',
    text: 'conntrack lookup',
    decides: false,
    ...fields,
  })
  const wrapper = mountResult(undefined, [
    stage({}),
    stage({ kind: 'rule', tier: 100, policy: 'web', rule: 1, action: 'allow', text: 'rule', decides: true }),
  ])

  expect(wrapper.text()).not.toContain('conntrack lookup')
  expect(wrapper.get('.all-steps').text()).toContain(t('firewall:trace:all-steps', { n: 1 }))

  await wrapper.get('.all-steps').trigger('click')

  expect(wrapper.text()).toContain('conntrack lookup')
})
