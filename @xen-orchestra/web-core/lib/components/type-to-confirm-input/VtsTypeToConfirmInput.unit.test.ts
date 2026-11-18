import VtsTypeToConfirmInput from '@core/components/type-to-confirm-input/VtsTypeToConfirmInput.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

function mountTypeToConfirmInput() {
  return mount(VtsTypeToConfirmInput, {
    global: createGlobalTestConfig(),
    props: { confirmationText: '2 VMs' },
    attachTo: document.body,
  })
}

describe('VtsTypeToConfirmInput', () => {
  it('shows no error before validating', () => {
    const wrapper = mountTypeToConfirmInput()

    expect(wrapper.find('.ui-info').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
  })

  it.each([
    { label: 'an empty text', text: '' },
    { label: 'a wrong text', text: '2 VM' },
  ])('rejects $label, shows the error and focuses the field', async ({ text }) => {
    const wrapper = mountTypeToConfirmInput()
    const input = wrapper.get('input')

    await input.setValue(text)

    expect(wrapper.vm.validate()).toBe(false)

    await nextTick()

    const error = wrapper.get('.ui-info')

    expect(error.text()).toBe(t('form:error:must-match', { text: '2 VMs' }))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(error.attributes('id')).toBeTruthy()
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'))
    expect(document.activeElement).toBe(input.element)
  })

  it('accepts the confirmation text', async () => {
    const wrapper = mountTypeToConfirmInput()

    await wrapper.get('input').setValue('2 VMs')

    expect(wrapper.vm.validate()).toBe(true)

    await nextTick()

    expect(wrapper.find('.ui-info').exists()).toBe(false)
  })

  it('hides the error as soon as the text changes', async () => {
    const wrapper = mountTypeToConfirmInput()

    wrapper.vm.validate()

    await wrapper.get('input').setValue('2')

    expect(wrapper.find('.ui-info').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
  })
})
