import VdfQuarantineLiftedAlert from '@/modules/vdf/components/VdfQuarantineLiftedAlert.vue'
import type { useVdfFirewallRights } from '@/modules/vdf/composables/vdf-rights.composable.ts'
import type { VdfOutsideTagChange } from '@/modules/vdf/types.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { flushPromises, mount } from '@vue/test-utils'

// vdf#141: a quarantine lifted outside this XO, an alert until someone with
// the firewall right to lift quarantines on the pool acknowledges it

// whether the current user may lift quarantines on the pool
const { rights } = vi.hoisted(() => ({ rights: { liftQuarantine: true } }))

vi.mock(import('@/modules/vdf/composables/vdf-rights.composable.ts'), () => ({
  useVdfFirewallRights: (() => ({
    can: (action: string) => action !== 'quarantine:remove' || rights.liftQuarantine,
    lockReason: (action: string) =>
      action === 'quarantine:remove' && !rights.liftQuarantine ? 'no quarantine:remove' : undefined,
  })) as unknown as typeof useVdfFirewallRights,
}))

const lifted: VdfOutsideTagChange = {
  id: 4,
  seenAt: '2026-11-12T10:00:00Z',
  object: { id: 'vm-1', type: 'VM', name: 'web-1' },
  tag: 'vdf:quarantine',
  change: 'removed',
  outsideXo: true,
}

const mountAlert = (canLiftQuarantine: boolean, vm = false) => {
  rights.liftQuarantine = canLiftQuarantine

  return mount(VdfQuarantineLiftedAlert, {
    props: { poolId: 'pool-1', changes: [lifted], vm },
    global: createGlobalTestConfig(),
  })
}

it('offers to acknowledge to who may lift a quarantine', async () => {
  const button = mountAlert(true).getComponent(UiButton)

  expect(button.text()).toBe(t('firewall:outside:quarantine-lifted:acknowledge'))
  expect(button.props('disabled')).toBeFalsy()
  expect(await findTooltipContent(button.element)).toBeFalsy()
})

it('says why the others may not acknowledge it', async () => {
  const button = mountAlert(false).getComponent(UiButton)

  expect(button.props('disabled')).toBe(true)
  expect(await findTooltipContent(button.element)).toBe('no quarantine:remove')
})

it("names the VM in the pool's alert, the date on the VM's", () => {
  expect(mountAlert(true).text()).toContain('web-1')
  expect(mountAlert(true, true).text()).not.toContain('web-1')
})

it('acknowledges the entry through the plugin, then says so', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ ...lifted, resolution: 'acknowledged' })))
  vi.stubGlobal('fetch', fetch)
  const wrapper = mountAlert(true)

  await wrapper.getComponent(UiButton).trigger('click')
  await flushPromises()

  expect(fetch).toHaveBeenCalledWith(
    '/rest/v0/plugins/vdf/pools/pool-1/actions/acknowledge_quarantine_lifted',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ entry: 4 }) })
  )
  expect(wrapper.emitted('acknowledged')).toHaveLength(1)
})
