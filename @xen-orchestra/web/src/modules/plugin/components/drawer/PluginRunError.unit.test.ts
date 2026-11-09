import PluginRunError from '@/modules/plugin/components/drawer/PluginRunError.vue'
import { ApiError } from '@/shared/error/api.error.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { mount } from '@vue/test-utils'

const TITLE = "The configuration couldn't be saved"

// an error of a plugin, as the REST API answers it
const PLUGIN_ERROR = { error: 'no monitor is configured' }

// a validation error, as the REST API answers it: its `error` is not a message
const VALIDATION_ERROR = {
  error: { body: { message: 'Value does not match any allowed schema', value: ['not an object'] } },
  data: {},
}

function mountError(error: Error) {
  return mount(PluginRunError, {
    props: { title: TITLE, error },
    global: createGlobalTestConfig(),
  })
}

it('shows the message of the server, not the HTTP status text', () => {
  const alert = mountError(new ApiError('Internal Server Error', { status: 500, cause: PLUGIN_ERROR })).getComponent(
    UiAlert
  )

  expect(alert.props('accent')).toBe('danger')
  expect(alert.text()).toContain(TITLE)
  expect(alert.text()).toContain('no monitor is configured')
  expect(alert.text()).not.toContain('Internal Server Error')
})

it('falls back to the HTTP status text when the server sent no message', () => {
  expect(
    mountError(new ApiError('Unprocessable Entity', { status: 422, cause: VALIDATION_ERROR }))
      .getComponent(UiAlert)
      .text()
  ).toContain('Unprocessable Entity')
  expect(
    mountError(new ApiError('Bad Gateway', { status: 502 }))
      .getComponent(UiAlert)
      .text()
  ).toContain('Bad Gateway')
})

it('shows the details of the server error', () => {
  const viewer = mountError(
    new ApiError('Unprocessable Entity', { status: 422, cause: VALIDATION_ERROR })
  ).getComponent(UiLogEntryViewer)

  expect(viewer.props()).toMatchObject({ label: t('api-error-details'), accent: 'danger', content: VALIDATION_ERROR })
})

it('shows the message of an error that did not come from the server, with no details', () => {
  const wrapper = mountError(new Error('Failed to fetch'))

  expect(wrapper.getComponent(UiAlert).text()).toContain('Failed to fetch')
  expect(wrapper.findComponent(UiLogEntryViewer).exists()).toBe(false)
})
