import KubernetesPausedStatus from '@/modules/kubernetes/components/KubernetesPausedStatus.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { mount } from '@vue/test-utils'

function mountKubernetesPausedStatus(paused: boolean) {
  return mount(KubernetesPausedStatus, {
    props: { paused },
    global: createGlobalTestConfig(),
  })
}

it('shows the paused icon with the yes label when paused', () => {
  const wrapper = mountKubernetesPausedStatus(true)

  expect(wrapper.getComponent(VtsIcon).props('name')).toBe('status:paused-circle')
  expect(wrapper.text()).toBe(t('yes'))
  expect(wrapper.findComponent(UiInfo).exists()).toBe(false)
})

it('shows the muted no status when not paused', () => {
  const wrapper = mountKubernetesPausedStatus(false)
  const info = wrapper.getComponent(UiInfo)

  expect(info.text()).toBe(t('no'))
  expect(info.props('accent')).toBe('muted')
})
