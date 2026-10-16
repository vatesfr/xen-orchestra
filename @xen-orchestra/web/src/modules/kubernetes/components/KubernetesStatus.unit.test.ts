import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import type { KubernetesStatus as KubernetesStatusValue } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { mount } from '@vue/test-utils'

function mountKubernetesStatus(status: KubernetesStatusValue) {
  return mount(KubernetesStatus, {
    props: { status },
    global: createGlobalTestConfig(),
  })
}

it('maps paused to the paused label with a warning accent', () => {
  const wrapper = mountKubernetesStatus('paused')
  const info = wrapper.getComponent(UiInfo)

  expect(info.text()).toBe(t('paused'))
  expect(info.props('accent')).toBe('warning')
})

it('maps yes to the yes label with a success accent', () => {
  const wrapper = mountKubernetesStatus('yes')
  const info = wrapper.getComponent(UiInfo)

  expect(info.text()).toBe(t('yes'))
  expect(info.props('accent')).toBe('success')
})

it('maps no to the no label with a muted accent', () => {
  const wrapper = mountKubernetesStatus('no')
  const info = wrapper.getComponent(UiInfo)

  expect(info.text()).toBe(t('no'))
  expect(info.props('accent')).toBe('muted')
})
