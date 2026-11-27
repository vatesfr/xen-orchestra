import ApplianceEditProxyButton from '@/modules/appliance/components/actions/edit-proxy/ApplianceEditProxyButton.vue'
import { useEditProxy } from '@/modules/appliance/composables/use-edit-proxy.composable.ts'
import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { ref } from 'vue'

const isRemovingProxy = ref(false)

// The composable runs the edit and the remove jobs, which call the REST API
const editProxy = createJobStub(useEditProxy, result => ({
  openEditProxyDrawer: result.run,
  isEditingProxy: result.isRunning,
  isRemovingProxy,
}))

beforeEach(() => {
  isRemovingProxy.value = false
})

const createProxy = (): XoaProxy => ({ host: 'proxy.example.org', port: 3128 })

const mountButton = itRunsJobFromButton(ApplianceEditProxyButton, {
  targetProp: 'proxy',
  createTarget: createProxy,
  getButton: wrapper => wrapper.getComponent(UiButton),
  job: editProxy,
  // The composable receives the proxy as a getter
  toJobTarget: proxy => proxy,
  disabledWhenCannotRun: false,
})

it('offers to edit the proxy', () => {
  const button = mountButton().getComponent(UiButton)

  expect(button.text()).toBe(t('action:edit-proxy'))
  expect(button.props('leftIcon')).toBe('action:edit')
})

it('shows the button as busy while the proxy is being removed', () => {
  isRemovingProxy.value = true

  expect(mountButton().getComponent(UiButton).props('busy')).toBe(true)
})
