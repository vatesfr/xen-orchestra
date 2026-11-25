import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiFileUploader from '@core/components/ui/file-uploader/UiFileUploader.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { findAccentedInfos, findInfoLabels } from '@core-test/find-accented-labels.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, type VNode } from 'vue'

type InputWrapperProps = InstanceType<typeof VtsInputWrapper>['$props']

type InputProps = InstanceType<typeof UiInput>['$props']

function mountInputWrapper({
  props = {},
  input = {},
  field,
  slots = {},
}: {
  props?: Partial<InputWrapperProps>
  input?: Partial<InputProps>
  field?: () => VNode
  slots?: Record<string, string>
} = {}) {
  return mount(VtsInputWrapper, {
    global: createGlobalTestConfig(),
    props: { label: 'Name', ...props },
    slots: { default: field ?? (() => h(UiInput, { modelValue: '', accent: 'neutral', ...input })), ...slots },
  })
}

function findMessageIds(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.attributes('id'))
}

describe('VtsInputWrapper', () => {
  it('renders the label prop', () => {
    expect(mountInputWrapper().getComponent(UiLabel).text()).toBe('Name')
  })

  it('renders the label slot instead of the prop', () => {
    expect(
      mountInputWrapper({ slots: { label: 'Slot label' } })
        .getComponent(UiLabel)
        .text()
    ).toBe('Slot label')
  })

  it('links the label to the input with its own id, over the input id', () => {
    const wrapper = mountInputWrapper({ input: { id: 'own-id' } })
    const inputId = wrapper.get('input').attributes('id')

    expect(inputId).not.toBe('own-id')
    expect(wrapper.getComponent(UiLabel).props('for')).toBe(inputId)
  })

  it('passes the learn more URL to the label', () => {
    const label = mountInputWrapper({ props: { learnMoreUrl: 'https://example.com' } }).getComponent(UiLabel)

    expect(label.props('href')).toBe('https://example.com')
  })

  it.each([true, false])('marks the label as required when the input required is %s', async required => {
    const wrapper = mountInputWrapper({ input: { required } })

    await nextTick()

    expect(wrapper.getComponent(UiLabel).props('required')).toBe(required)
  })

  it('leaves the input undescribed and valid without message', () => {
    const input = mountInputWrapper().get('input')

    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('describes the input with every message', () => {
    const wrapper = mountInputWrapper({ props: { message: ['Info', { content: 'Warning', accent: 'warning' }] } })
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
    const input = mountInputWrapper({ props: { message: { content: 'Message', accent } } }).get('input')

    expect(input.attributes('aria-invalid')).toBe(expected)
  })

  it('marks the input as invalid when a danger message sits beside other messages', () => {
    const input = mountInputWrapper({
      props: {
        message: [
          { content: 'Error', accent: 'danger' },
          { content: 'Warning', accent: 'warning' },
        ],
      },
    }).get('input')

    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it.each([
    { messageAccent: undefined, labelAccent: 'neutral', inputAccent: 'neutral' },
    { messageAccent: 'info', labelAccent: 'neutral', inputAccent: 'neutral' },
    { messageAccent: 'muted', labelAccent: 'neutral', inputAccent: 'neutral' },
    { messageAccent: 'success', labelAccent: 'neutral', inputAccent: 'success' },
    { messageAccent: 'warning', labelAccent: 'warning', inputAccent: 'warning' },
    { messageAccent: 'danger', labelAccent: 'danger', inputAccent: 'danger' },
  ] as const)(
    'gives a $messageAccent message a $labelAccent label and a $inputAccent input',
    ({ messageAccent, labelAccent, inputAccent }) => {
      const wrapper = mountInputWrapper({
        props: { message: messageAccent && { content: 'Message', accent: messageAccent } },
      })

      expect(wrapper.getComponent(UiLabel).props('accent')).toBe(labelAccent)
      expect(wrapper.getComponent(UiInput).classes()).toContain(`accent--${inputAccent}`)
    }
  )

  it('lists the messages by rank, a plain string as info, and takes its accents from the highest', () => {
    const wrapper = mountInputWrapper({
      props: { message: [{ content: 'Error', accent: 'danger' }, 'Info', { content: 'Valid', accent: 'success' }] },
    })

    expect(findAccentedInfos(wrapper)).toEqual([
      { label: 'Info', accent: 'info' },
      { label: 'Valid', accent: 'success' },
      { label: 'Error', accent: 'danger' },
    ])
    expect(wrapper.getComponent(UiLabel).props('accent')).toBe('danger')
  })

  it('renders the message slot with the content and the accent', () => {
    const wrapper = mountInputWrapper({
      props: { message: { content: 'Message', accent: 'warning' } },
      slots: { message: '<template #message="{ content, accent }">{{ content }} ({{ accent }})</template>' },
    })

    expect(findInfoLabels(wrapper)).toEqual(['Message (warning)'])
  })

  it.each([true, false])('passes wrapMessage %s to the messages', wrapMessage => {
    const info = mountInputWrapper({ props: { message: 'Info', wrapMessage } }).getComponent(UiInfo)

    expect(info.props('wrap')).toBe(wrapMessage)
  })

  it('leaves a detached input out of the wrapper', async () => {
    const wrapper = mountInputWrapper({
      props: { message: { content: 'Error', accent: 'danger' } },
      input: { detached: true, required: true },
    })
    const input = wrapper.get('input')

    await nextTick()

    expect(wrapper.getComponent(UiInput).classes()).toContain('accent--neutral')
    expect(input.attributes('id')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.getComponent(UiLabel).props('required')).toBe(false)
  })

  it('describes the file uploader with its messages', () => {
    const wrapper = mountInputWrapper({
      props: { label: 'File', message: 'Info' },
      field: () => h(UiFileUploader, { accent: 'neutral' }),
    })

    expect(wrapper.get('button.dropzone').attributes('aria-describedby')).toBe(findMessageIds(wrapper).join(' '))
  })

  it('keeps the file uploader accent with a success message', () => {
    const wrapper = mountInputWrapper({
      props: { message: { content: 'Valid', accent: 'success' } },
      field: () => h(UiFileUploader, { accent: 'neutral' }),
    })

    expect(wrapper.getComponent(UiFileUploader).find('.accent--neutral').exists()).toBe(true)
  })
})
