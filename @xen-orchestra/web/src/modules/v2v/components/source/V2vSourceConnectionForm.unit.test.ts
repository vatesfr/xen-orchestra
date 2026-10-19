import V2vPrerequisiteStatus from '@/modules/v2v/components/source/V2vPrerequisiteStatus.vue'
import V2vSourceConnectionForm from '@/modules/v2v/components/source/V2vSourceConnectionForm.vue'
import { useV2vConnectionForm } from '@/modules/v2v/form/use-v2v-connection-form.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import { findButtonByLabel } from '@/test/find-button.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

type FormProps = ComponentProps<typeof V2vSourceConnectionForm>

function createForm() {
  return mountComposable(() => ({ form: reactive(useV2vConnectionForm()) })).wrapper.vm.form
}

function mountConnectionForm(props: Partial<FormProps> = {}, { attachTo }: { attachTo?: HTMLElement } = {}) {
  return mount(V2vSourceConnectionForm, {
    attachTo,
    props: {
      form: createForm(),
      prerequisite: { state: 'ok' },
      canConnect: true,
      isConnecting: false,
      connectionError: undefined,
      ...props,
    },
    global: createGlobalTestConfig(),
  })
}

function findConnectButton(wrapper: ReturnType<typeof mountConnectionForm>) {
  return findButtonByLabel(wrapper, t('action:connect'))
}

it('shows the prerequisite check', () => {
  const wrapper = mountConnectionForm({ prerequisite: { state: 'checking' } })

  expect(wrapper.getComponent(V2vPrerequisiteStatus).props('prerequisite')).toEqual({ state: 'checking' })
})

it('asks for the host, port, username and password, all required', () => {
  const wrapper = mountConnectionForm()

  expect(wrapper.findAll('.ui-label').map(label => label.text())).toEqual([
    t('host'),
    t('port'),
    t('username'),
    t('password'),
  ])
  expect(wrapper.findAll('input[required]')).toHaveLength(4)
})

it('explains what skipping the SSL check means', () => {
  expect(mountConnectionForm().get('.option').text()).toBe(`${t('skip-ssl-check')}${t('skip-ssl-check-info')}`)
})

it('focuses the password on request', () => {
  const wrapper = mountConnectionForm({}, { attachTo: document.body })

  wrapper.vm.focusPassword()

  expect(document.activeElement).toBe(wrapper.get('input[type="password"]').element)
})

it('shows the error of a field under it', async () => {
  const form = createForm()
  const wrapper = mountConnectionForm({ form })

  await form.validate()
  await flushPromises()

  expect(findInputMessages(wrapper.findAllComponents(FormTextInput)[0])).toEqual([t('host-required')])
})

it('warns about storing credentials only when remembering the connection', async () => {
  const form = createForm()
  const wrapper = mountConnectionForm({ form })

  expect(wrapper.text()).not.toContain(t('remember-credentials-warning'))

  form.formData.remember = true
  await flushPromises()

  expect(wrapper.text()).toContain(t('remember-credentials-warning'))
})

it('shows the connection error only when there is one', () => {
  expect(mountConnectionForm().findComponent(UiAlert).exists()).toBe(false)
  expect(mountConnectionForm({ connectionError: 'host unreachable' }).getComponent(UiAlert).text()).toContain(
    'host unreachable'
  )
})

it('submits the form', async () => {
  const wrapper = mountConnectionForm()

  await wrapper.get('form').trigger('submit')

  expect(wrapper.emitted('submit')).toHaveLength(1)
})

it('cancels', async () => {
  const wrapper = mountConnectionForm()

  await findButtonByLabel(wrapper, t('cancel'))?.trigger('click')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})

it('cannot connect while the prerequisites are not met', () => {
  expect(findConnectButton(mountConnectionForm({ canConnect: false }))?.props('disabled')).toBe(true)
  expect(findConnectButton(mountConnectionForm())?.props('disabled')).toBe(false)
})

it('shows the connection in progress', () => {
  expect(findConnectButton(mountConnectionForm({ isConnecting: true }))?.props('busy')).toBe(true)
})
