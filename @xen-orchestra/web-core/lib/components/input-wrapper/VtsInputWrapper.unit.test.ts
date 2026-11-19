import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiFileUploader from '@core/components/ui/file-uploader/UiFileUploader.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'

function mountInputWrapper(message?: InputWrapperMessage) {
  return mount(VtsInputWrapper, {
    global: createGlobalTestConfig(),
    props: { label: 'Name', message },
    slots: { default: () => h(UiInput, { modelValue: '', accent: 'brand' }) },
  })
}

function findMessageIds(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.attributes('id'))
}

describe('VtsInputWrapper', () => {
  it('leaves the input undescribed and valid without message', () => {
    const input = mountInputWrapper().get('input')

    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('describes the input with every message', () => {
    const wrapper = mountInputWrapper(['Info', { content: 'Warning', accent: 'warning' }])
    const messageIds = findMessageIds(wrapper)

    expect(messageIds).toHaveLength(2)
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(messageIds.join(' '))
  })

  it.each([
    { accent: 'info', expected: undefined },
    { accent: 'success', expected: undefined },
    { accent: 'warning', expected: undefined },
    { accent: 'muted', expected: undefined },
    { accent: 'danger', expected: 'true' },
  ] as const)('sets aria-invalid to $expected for a $accent message', ({ accent, expected }) => {
    const input = mountInputWrapper({ content: 'Message', accent }).get('input')

    expect(input.attributes('aria-invalid')).toBe(expected)
  })

  it('marks the input as invalid when a danger message sits beside other messages', () => {
    const input = mountInputWrapper([
      { content: 'Error', accent: 'danger' },
      { content: 'Warning', accent: 'warning' },
    ]).get('input')

    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('describes the file uploader with its messages', () => {
    const wrapper = mount(VtsInputWrapper, {
      global: createGlobalTestConfig(),
      props: { label: 'File', message: 'Info' },
      slots: { default: () => h(UiFileUploader, { accent: 'neutral' }) },
    })

    expect(wrapper.get('button.dropzone').attributes('aria-describedby')).toBe(findMessageIds(wrapper).join(' '))
  })
})
