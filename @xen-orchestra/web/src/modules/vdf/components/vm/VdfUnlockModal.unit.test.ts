import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import VdfUnlockModal from '@/modules/vdf/components/vm/VdfUnlockModal.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { mount } from '@vue/test-utils'

// vdf#41: unlocking a VDF lock keeps its allowed addresses unless cleared

const mountModal = (allowed: string[]) =>
  mount(VdfUnlockModal, {
    props: { target: { vifId: 'vif-1', device: '0', vmName: 'app-1', allowed }, state: {} },
    global: createGlobalTestConfig(),
  })

it('keeps the allowed addresses by default, clears them when ticked', async () => {
  const wrapper = mountModal(['10.0.0.5'])

  wrapper.findComponent(VdfContentModal).vm.$emit('confirm')
  wrapper.getComponent(UiCheckbox).vm.$emit('update:modelValue', true)
  await wrapper.vm.$nextTick()
  wrapper.findComponent(VdfContentModal).vm.$emit('confirm')

  expect(wrapper.emitted('confirm')).toEqual([[false], [true]])
})

it('offers no clearing without allowed addresses', () => {
  expect(mountModal([]).findComponent(UiCheckbox).exists()).toBe(false)
})
