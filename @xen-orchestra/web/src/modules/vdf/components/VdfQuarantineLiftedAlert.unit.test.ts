import VdfQuarantineLiftedAlert from '@/modules/vdf/components/VdfQuarantineLiftedAlert.vue'
import type { VdfOutsideTagChange } from '@/modules/vdf/types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { flushPromises, mount } from '@vue/test-utils'

// vdf#141: a quarantine lifted outside this XO, an alert until someone with
// the pool's administrate acknowledges it

const lifted: VdfOutsideTagChange = {
  id: 4,
  seenAt: '2026-11-12T10:00:00Z',
  object: { id: 'vm-1', type: 'VM', name: 'web-1' },
  tag: 'vdf:quarantine',
  change: 'removed',
  outsideXo: true,
}

const mountAlert = (canAcknowledge: boolean, vm = false) =>
  mount(VdfQuarantineLiftedAlert, {
    props: { poolId: 'pool-1', changes: [lifted], canAcknowledge, vm },
    global: createGlobalTestConfig(),
  })

it('offers to acknowledge only to who may', () => {
  expect(mountAlert(false).findComponent(UiButton).exists()).toBe(false)
  expect(mountAlert(true).getComponent(UiButton).text()).toBe(t('firewall:outside:quarantine-lifted:acknowledge'))
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
