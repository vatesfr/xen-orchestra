import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import VdfLockModal from '@/modules/vdf/components/vm/VdfLockModal.vue'
import type { VdfLockState, VdfLockTarget } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import type { VdfLockRequest } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

// vdf#41: XAPI refuses to lock while an SDN controller is registered; the
// confirmation then offers a VDF lock, which confirming again sends

const target = (fields: Partial<VdfLockTarget> = {}): VdfLockTarget => ({
  vifId: 'vif-1',
  device: '0',
  vmName: 'app-1',
  networkName: 'Pool-wide network',
  addresses: ['10.0.0.5'],
  optional: [],
  lock: 'unlocked',
  hostName: 'host-a',
  ...fields,
})

function mountModal(targets: VdfLockTarget[], state: VdfLockState, group?: string) {
  return mount(VdfLockModal, {
    props: { targets, state, group },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

const confirm = async (wrapper: ReturnType<typeof mountModal>) => {
  wrapper.findComponent(VdfContentModal).vm.$emit('confirm')
  await wrapper.vm.$nextTick()

  return wrapper.emitted('confirm')?.at(-1)?.[0] as VdfLockRequest[] | undefined
}

it('locks with XAPI, then offers VDF once XAPI refused for the SDN controller', async () => {
  const state = reactive<VdfLockState>({ locked: [], errors: {}, sdnRefused: [] })
  const wrapper = mountModal([target()], state)

  expect(document.body.textContent).not.toContain(t('firewall:lock:vdf-offer'))
  expect(await confirm(wrapper)).toEqual([
    { vifId: 'vif-1', ipv4: ['10.0.0.5'], ipv6: [], withVdf: false, xapiLocked: false },
  ])

  // the caller records XAPI's refusal
  state.errors = { 'vif-1': t('firewall:lock:error:sdn-controller', { detail: 'A vswitch controller is active' }) }
  state.sdnRefused.push('vif-1')
  await wrapper.vm.$nextTick()

  expect(document.body.textContent).toContain(t('firewall:lock:vdf-offer'))
  expect(document.body.textContent).toContain(t('firewall:lock:confirm:vdf'))
  expect(await confirm(wrapper)).toEqual([
    { vifId: 'vif-1', ipv4: ['10.0.0.5'], ipv6: [], withVdf: true, xapiLocked: false },
  ])
  wrapper.unmount()
})

it("says why VDF can't lock it either, and retries with XAPI", async () => {
  const state = reactive<VdfLockState>({ locked: [], errors: { 'vif-1': 'refused' }, sdnRefused: ['vif-1'] })
  const wrapper = mountModal([target({ vdfUnavailable: 'old-agent' })], state)

  expect(document.body.textContent).toContain(t('firewall:lock:vdf-unavailable:old-agent'))
  expect((await confirm(wrapper))?.[0]).toMatchObject({ withVdf: false })
  wrapper.unmount()
})

it('relocks a VDF lock with VDF, a XAPI lock without setting its mode', async () => {
  const state = reactive<VdfLockState>({ locked: [], errors: {}, sdnRefused: [] })
  const wrapper = mountModal(
    [target({ lock: 'vdf-unenforced', lockedTo: ['10.0.0.4'] }), target({ vifId: 'vif-2', lock: 'xapi' })],
    state,
    'app'
  )

  expect(await confirm(wrapper)).toEqual([
    { vifId: 'vif-1', ipv4: ['10.0.0.5'], ipv6: [], withVdf: true, xapiLocked: false },
    { vifId: 'vif-2', ipv4: ['10.0.0.5'], ipv6: [], withVdf: false, xapiLocked: true },
  ])
  wrapper.unmount()
})
