import VdfPolicyRow from '@/modules/vdf/components/policies/VdfPolicyRow.vue'
import type { VdfPolicy } from '@/modules/vdf/types.ts'
import type { VdfRuleBasePolicy } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'

const entry = (policy: Partial<VdfPolicy> = {}): VdfRuleBasePolicy => ({
  policy: { name: 'web', appliedTo: 'web', default: 'drop', ingress: [], ...policy },
  state: undefined,
  locked: false,
  rules: [],
  egressRules: [],
  isFirst: true,
  isLast: true,
})

const mountRow = (policy?: Partial<VdfPolicy>) =>
  mount(
    { components: { VdfPolicyRow }, template: '<table><tbody><VdfPolicyRow v-bind="$attrs" /></tbody></table>' },
    {
      attrs: {
        scopeId: 'pool-1',
        entry: entry(policy),
        columns: 6,
        members: 2,
        groupExists: () => true,
        realization: { realized: 1, total: 1, unknown: 0 },
        highlighted: false,
        anchorId: 'policy-web',
      },
      global: createGlobalTestConfig(),
      attachTo: document.body,
    }
  )

// UX P2-3: an outbound rule as easy to add as an inbound one
it('adds an inbound or an outbound rule from "Add rule"', async () => {
  const wrapper = mountRow()

  await wrapper.get('button.add-rule').trigger('click')
  await flushPromises()

  const items = [...document.body.querySelectorAll('.menu-item')]
  const outbound = items.find(item => item.textContent?.includes(t('firewall:add-rule:outbound')))

  expect(items.some(item => item.textContent?.includes(t('firewall:add-rule:inbound')))).toBe(true)
  ;(outbound!.firstElementChild as HTMLElement).click()
  await flushPromises()

  expect(wrapper.findComponent(VdfPolicyRow).emitted('addEgressRule')).toHaveLength(1)
  wrapper.unmount()
})

// UX P1-1: a pool's monitored policy opens its report
it("links a pool's Monitor tag to the policy's report", () => {
  const link = mountRow({ mode: 'monitor' }).get('a.monitor-link')

  expect(link.attributes('href')).toBe('/pool/pool-1/firewall/monitor?policy=web')
})
