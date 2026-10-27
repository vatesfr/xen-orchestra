import VdfPolicyDrawer from '@/modules/vdf/components/drawers/VdfPolicyDrawer.vue'
import type { VdfPolicy } from '@/modules/vdf/types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { flushPromises, mount } from '@vue/test-utils'

// UX P2-1: the safety choice early, the same option order twice, the
// outbound default out of the way unless set, the log only for a drop

const policy = (fields: Partial<VdfPolicy> = {}): VdfPolicy => ({
  name: 'web',
  appliedTo: 'web',
  default: 'drop',
  ingress: [],
  ...fields,
})

const mountDrawer = (fields: Partial<VdfPolicy> = {}) =>
  mount(VdfPolicyDrawer, {
    props: {
      policy: policy(fields),
      isNew: false,
      groups: [{ name: 'web', members: 2, ips: 0 }],
      otherPolicyNames: [],
    },
    global: createGlobalTestConfig(),
  })

it('asks for the name, what it applies to, the tier, the mode, then the default', () => {
  const text = mountDrawer().text()
  const at = (label: string) => text.indexOf(label)

  expect(at(t('firewall:applied-to'))).toBeLessThan(at(t('firewall:tier')))
  expect(at(t('firewall:tier'))).toBeLessThan(at(t('firewall:policy-form:mode')))
  expect(at(t('firewall:policy-form:mode'))).toBeLessThan(at(t('firewall:policy-form:default')))
})

it('keeps the outbound default folded unless the policy has one or outbound rules', async () => {
  expect(mountDrawer().text()).not.toContain(t('firewall:policy-form:egress-default'))
  expect(mountDrawer({ egressDefault: 'drop' }).text()).toContain(t('firewall:policy-form:egress-default'))
  expect(mountDrawer({ egress: [{ id: 3, to: 'any', proto: 'tcp' }] }).text()).toContain(
    t('firewall:policy-form:egress-default')
  )

  const wrapper = mountDrawer()

  await wrapper.get('.vdf-technical-details button').trigger('click')
  // the same order as the inbound default: Drop, Allow, Next tier
  const groups = wrapper.findAll('.ui-radio-button-group')
  // (its own label first)
  const labels = (index: number) =>
    groups[index]
      .findAll('label')
      .slice(1)
      .map(label => label.text())

  expect(labels(groups.length - 1)).toEqual(labels(groups.length - 2))
})

it('offers to log only what a default drops, and saves it only then', async () => {
  expect(mountDrawer({ default: 'allow' }).text()).not.toContain(t('firewall:policy-form:log-default'))
  expect(mountDrawer({ default: 'drop' }).text()).toContain(t('firewall:policy-form:log-default'))

  const wrapper = mountDrawer({ default: 'allow', logDefault: true })

  wrapper.findComponent(UiDrawer).vm.$emit('confirm')
  await flushPromises()

  expect((wrapper.emitted('confirm')?.[0]?.[0] as VdfPolicy).logDefault).toBeUndefined()
})
