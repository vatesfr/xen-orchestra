import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { blurField, setFieldValue } from '@core-test/field-events.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { t } from '@core-test/i18n.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

type TextareaProps = InstanceType<typeof UiTextarea>['$props']

function mountTextarea(
  props: Partial<TextareaProps> = {},
  { slots, attrs }: { slots?: Record<string, string>; attrs?: Record<string, string> } = {}
) {
  return mount(UiTextarea, {
    global: createGlobalTestConfig(),
    props: { accent: 'neutral', modelValue: 'Value', ...props },
    slots,
    attrs,
    attachTo: document.body,
  })
}

describe('UiTextarea', () => {
  it.each(['neutral', 'warning', 'danger'] as const)('applies the %s accent to the field and its label', accent => {
    const wrapper = mountTextarea({ accent }, { slots: { default: 'Label' } })
    const label = wrapper.getComponent(UiLabel)

    expect(wrapper.classes()).toContain(`accent--${accent}`)
    expect(label.props('accent')).toBe(accent)
    expect(label.text()).toBe('Label')
  })

  it('renders no label without the default slot', () => {
    expect(mountTextarea().findComponent(UiLabel).exists()).toBe(false)
  })

  it('forwards required, href and the id to the label, and the id to the textarea', () => {
    const wrapper = mountTextarea(
      { id: 'notes', required: true, href: 'https://docs.example' },
      { slots: { default: 'Label' } }
    )

    expect(wrapper.getComponent(UiLabel).props()).toMatchObject({
      for: 'notes',
      required: true,
      href: 'https://docs.example',
    })
    expect(wrapper.get('textarea').attributes('id')).toBe('notes')
  })

  it('links the label to the textarea with a generated id when none is given', () => {
    const wrapper = mountTextarea({}, { slots: { default: 'Label' } })
    const textareaId = wrapper.get('textarea').attributes('id')

    expect(textareaId).toBeTruthy()
    expect(wrapper.getComponent(UiLabel).props('for')).toBe(textareaId)
  })

  it('forwards the disabled state and extra attributes to the textarea, not the root', () => {
    const wrapper = mountTextarea({ disabled: true }, { attrs: { placeholder: 'Notes' } })
    const textarea = wrapper.get('textarea')

    expect(textarea.element.value).toBe('Value')
    expect(textarea.attributes()).toMatchObject({ placeholder: 'Notes', disabled: '' })
    expect(wrapper.attributes('placeholder')).toBeUndefined()
  })

  it('updates the model while typing', async () => {
    expect(await setFieldValue(mountTextarea(), 'textarea', 'New value')).toEqual([['New value']])
  })

  it.each([
    ['without maxCharacters', undefined],
    ['when maxCharacters is 0', 0],
  ])('shows no character count and no limit error %s', (_case, maxCharacters) => {
    const wrapper = mountTextarea({ modelValue: 'A long value', maxCharacters })

    expect(wrapper.findComponent(UiCharacterLimit).exists()).toBe(false)
    expect(findAccentedInfos(wrapper)).toEqual([])
    expect(wrapper.classes()).toContain('accent--neutral')
  })

  it('counts the trimmed characters against maxCharacters', () => {
    const wrapper = mountTextarea({ modelValue: '  abc  ', maxCharacters: 10 })

    expect(wrapper.getComponent(UiCharacterLimit).props()).toEqual({ count: 3, max: 10 })
  })

  it('switches to danger with an error once the trimmed value exceeds maxCharacters, the label keeping its accent', () => {
    const wrapper = mountTextarea({ modelValue: 'abcd', maxCharacters: 3 }, { slots: { default: 'Label' } })

    expect(wrapper.classes()).toContain('accent--danger')
    expect(findAccentedInfos(wrapper)).toEqual([
      { label: t('field:exceeds-max-characters', { max: 3 }), accent: 'danger' },
    ])
    expect(wrapper.getComponent(UiLabel).props('accent')).toBe('neutral')
  })

  it.each([
    { case: 'at the limit', modelValue: 'abc' },
    { case: 'over it only with surrounding spaces', modelValue: '  abc  ' },
  ])('keeps its accent and shows no error $case', ({ modelValue }) => {
    const wrapper = mountTextarea({ accent: 'warning', modelValue, maxCharacters: 3 })

    expect(wrapper.classes()).toContain('accent--warning')
    expect(findAccentedInfos(wrapper)).toEqual([])
  })

  it('waits for the textarea to lose the focus before reporting the exceeded limit', async () => {
    const wrapper = mountTextarea({ modelValue: 'abcd', maxCharacters: 3 })
    const textarea = wrapper.get('textarea')

    // useFocus attaches its listeners once the template ref is set
    await nextTick()
    await textarea.trigger('focus')

    expect(wrapper.classes()).toContain('accent--neutral')
    expect(findAccentedInfos(wrapper)).toEqual([])

    await blurField(wrapper, 'textarea')

    expect(wrapper.classes()).toContain('accent--danger')
  })

  it.each([
    { accent: 'neutral', infos: [] },
    { accent: 'warning', infos: [{ label: 'Message', accent: 'warning' }] },
    { accent: 'danger', infos: [{ label: 'Message', accent: 'danger' }] },
  ] as const)('shows the message slot only with a warning or danger accent ($accent)', ({ accent, infos }) => {
    expect(findAccentedInfos(mountTextarea({ accent }, { slots: { message: 'Message' } }))).toEqual(infos)
  })

  it('shows the info slot as an info message, before the message', () => {
    const wrapper = mountTextarea({ accent: 'danger' }, { slots: { info: 'Info', message: 'Message' } })

    expect(findAccentedInfos(wrapper)).toEqual([
      { label: 'Info', accent: 'info' },
      { label: 'Message', accent: 'danger' },
    ])
  })
})
