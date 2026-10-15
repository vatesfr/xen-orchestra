import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import { useJsonSchemaForm } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' })]),
    areVmsReady: ref(true),
    hasVmFetchError: ref(false),
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    hosts: ref([]),
    areHostsReady: ref(true),
    hasHostFetchError: ref(false),
  })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([]),
    arePoolsReady: ref(true),
    hasPoolFetchError: ref(false),
  })) as unknown as typeof useXoPoolCollection,
}))

// the SRs never load, to test a field waiting for its options
vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: ref([]),
    areSrsReady: ref(false),
    hasSrFetchError: ref(false),
  })) as unknown as typeof useXoSrCollection,
}))

function mountField(props: {
  schema: JsonSchema
  label?: string
  path?: string[]
  required?: boolean
  disabled?: boolean
  modelValue?: unknown
}) {
  return mount(JsonSchemaField, {
    props: { label: 'Field', ...props },
    global: createGlobalTestConfig(),
  })
}

function lastEmittedValue(wrapper: ReturnType<typeof mountField>) {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0]
}

function getButton(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find(button => button.text() === text)

  if (button === undefined) {
    throw new Error(`no "${text}" button`)
  }

  return button
}

function findLabels(wrapper: VueWrapper) {
  return wrapper.findAll('label').map(label => label.text())
}

// an input wrapper learns that its input is required once the input is mounted
async function findRequiredLabels(wrapper: VueWrapper) {
  await nextTick()

  return wrapper.findAll('label.required').map(label => label.text())
}

function findSelectedLabel(wrapper: VueWrapper) {
  return wrapper.get('.vts-select').text()
}

function mountForm(schema: JsonSchema, modelValue: unknown) {
  let form: ReturnType<typeof useJsonSchemaForm> | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        form = useJsonSchemaForm(schema, modelValue)

        return () => h(JsonSchemaField, { schema, label: 'Form', required: true, modelValue })
      },
    }),
    { global: createGlobalTestConfig() }
  )

  if (form === undefined) {
    throw new Error('the form is not set up')
  }

  return { wrapper, form }
}

describe('string field', () => {
  it('displays the current value', () => {
    const wrapper = mountField({ schema: { type: 'string' }, modelValue: 'foo' })

    expect(wrapper.get('input').element.value).toBe('foo')
  })

  it('emits the typed value', async () => {
    const wrapper = mountField({ schema: { type: 'string' } })

    await wrapper.get('input').setValue('bar')

    expect(lastEmittedValue(wrapper)).toBe('bar')
  })

  it('emits undefined when the input is cleared', async () => {
    const wrapper = mountField({ schema: { type: 'string' }, modelValue: 'foo' })

    await wrapper.get('input').setValue('')

    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })

  it('hides passwords', () => {
    const wrapper = mountField({ schema: { type: 'string' }, path: ['password'] })

    expect(wrapper.get('input').attributes('type')).toBe('password')
  })

  it('displays other strings as text', () => {
    const wrapper = mountField({ schema: { type: 'string' }, path: ['username'] })

    expect(wrapper.get('input').attributes('type')).toBe('text')
  })

  it('uses a textarea for multiline strings', () => {
    const wrapper = mountField({ schema: { type: 'string', $multiline: true }, modelValue: 'foo' })

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('textarea').element.value).toBe('foo')
  })

  it('emits undefined when a multiline string is cleared', async () => {
    const wrapper = mountField({ schema: { type: 'string', $multiline: true }, modelValue: 'foo' })

    await wrapper.get('textarea').setValue('')

    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })

  it('displays the help text of the description', () => {
    const wrapper = mountField({ schema: { type: 'string', description: 'ID attribute. e.g.: `dn`' } })

    expect(wrapper.get('.ui-info').text()).toBe('ID attribute.')
  })

  it('disables the input', () => {
    const wrapper = mountField({ schema: { type: 'string' }, disabled: true })

    expect(wrapper.get('input').element.disabled).toBe(true)
  })
})

describe('string field helpers', () => {
  it('fills the value with an example', async () => {
    const wrapper = mountField({ schema: { type: 'string', description: 'ID attribute. e.g.: `dn`' } })

    await getButton(wrapper, 'dn').trigger('click')

    expect(lastEmittedValue(wrapper)).toBe('dn')
  })

  it('fills a numeric value with an example as a number', async () => {
    const wrapper = mountField({ schema: { type: 'integer', description: 'Port. e.g.: `587`' } })

    await getButton(wrapper, '587').trigger('click')

    expect(lastEmittedValue(wrapper)).toBe(587)
  })

  it('resets a value to the default', async () => {
    const wrapper = mountField({ schema: { type: 'string', default: '(uid={{name}})' }, modelValue: '(cn={{name}})' })

    await getButton(wrapper, t('action:reset-to-default')).trigger('click')

    expect(lastEmittedValue(wrapper)).toBe('(uid={{name}})')
  })

  it('does not offer to reset a value which is the default', () => {
    const wrapper = mountField({ schema: { type: 'string', default: 'foo' }, modelValue: 'foo' })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('does not offer to reset an unset value, which already uses the default', () => {
    const wrapper = mountField({ schema: { type: 'string', default: 'foo' } })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('displays the default as a placeholder', () => {
    const wrapper = mountField({ schema: { type: 'integer', default: 389 } })

    expect(wrapper.get('input').attributes('placeholder')).toBe('389')
  })
})

describe('validation', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      uri: { type: 'string' },
      bind: { type: 'object', properties: { dn: { type: 'string' } }, required: ['dn'] },
    },
    required: ['uri'],
  }

  function findFieldsInError(wrapper: VueWrapper) {
    return wrapper
      .findAll('.vts-input-wrapper')
      .filter(field => field.text().includes(t('form:error:required')))
      .map(field => field.get('label').text())
  }

  it('displays the error of a required field once the user left it', async () => {
    const { wrapper } = mountForm(schema, {})

    expect(findFieldsInError(wrapper)).toEqual([])

    await wrapper.get('input[type="text"]').trigger('focusout')

    expect(findFieldsInError(wrapper)).toEqual(['uri'])
  })

  it('displays all the errors once validated, with their count in the sections', async () => {
    const { wrapper, form } = mountForm(schema, { bind: {} })

    form.submit()
    await wrapper.vm.$nextTick()

    expect(findFieldsInError(wrapper)).toEqual(['uri', 'dn'])
    expect(wrapper.findAll('.ui-counter').map(counter => counter.text())).toEqual(['1'])
  })

  it('does not count the errors of a section until they are displayed', () => {
    const { wrapper } = mountForm(schema, { bind: {} })

    expect(wrapper.find('.ui-counter').exists()).toBe(false)
  })

  it('gives each field the ID of its error, so that the error summary can focus it', () => {
    const { wrapper, form } = mountForm(schema, { bind: {} })

    expect(form.errors.value.map(error => wrapper.find(`[id="${error.id}"] input`).exists())).toEqual([true, true])
  })

  it('displays the error of an XO object field whose options are loading, and gives it its ID', async () => {
    const { wrapper, form } = mountForm(
      { type: 'object', properties: { sr: { type: 'string', $type: 'SR' } }, required: ['sr'] },
      {}
    )

    form.submit()
    await nextTick()

    expect(findFieldsInError(wrapper)).toEqual(['sr'])
    expect(wrapper.find(`[id="${form.errors.value[0].id}"]`).exists()).toBe(true)
  })

  it('validates a filled form', () => {
    const { form } = mountForm(schema, { uri: 'ldap://foo' })

    expect(form.submit()).toBe(true)
  })
})

describe('number field', () => {
  it('emits integers', async () => {
    const wrapper = mountField({ schema: { type: 'integer' } })

    await wrapper.get('input').setValue('25')

    expect(lastEmittedValue(wrapper)).toBe(25)
  })

  it('emits decimal numbers', async () => {
    const wrapper = mountField({ schema: { type: 'number' } })

    await wrapper.get('input').setValue('2.5')

    expect(lastEmittedValue(wrapper)).toBe(2.5)
  })

  it('uses a number input, with the bounds of the schema', () => {
    const wrapper = mountField({ schema: { type: 'integer', minimum: 1, maximum: 65535 } })

    expect(wrapper.get('input').attributes()).toMatchObject({ type: 'number', min: '1', max: '65535', step: '1' })
  })
})

describe('enum field', () => {
  it('displays the name of the current value', () => {
    const wrapper = mountField({
      schema: { type: 'string', enum: ['ldap', 'ldaps'], enumNames: ['LDAP', 'LDAP over TLS'] },
      modelValue: 'ldaps',
    })

    expect(findSelectedLabel(wrapper)).toBe('LDAP over TLS')
  })

  it('displays the current value without names', () => {
    const wrapper = mountField({ schema: { type: 'integer', enum: [389, 636] }, modelValue: 636 })

    expect(findSelectedLabel(wrapper)).toBe('636')
  })
})

describe('XO object field', () => {
  it('displays the name of the referenced object', () => {
    const wrapper = mountField({ schema: { type: 'string', $type: 'VM' }, modelValue: 'vm-1' })

    expect(findSelectedLabel(wrapper)).toBe('Web server')
  })
})

describe('object field', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      host: { type: 'string', title: 'Host' },
      port: { type: 'integer' },
    },
    required: ['host'],
  }

  it('renders a field per property, labelled by its title or its key', () => {
    const wrapper = mountField({ schema, required: true })

    expect(findLabels(wrapper)).toEqual(['Host', 'port'])
  })

  it('marks the required properties', async () => {
    const wrapper = mountField({ schema, required: true })

    expect(await findRequiredLabels(wrapper)).toEqual(['Host'])
  })

  it('merges the property in the current value', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: { host: 'example.org' } })

    await wrapper.findAll('input')[1].setValue('587')

    expect(lastEmittedValue(wrapper)).toEqual({ host: 'example.org', port: 587 })
  })

  it('hides the properties of an optional empty object until asked', async () => {
    const wrapper = mountField({ schema })

    expect(findLabels(wrapper)).toEqual(['Field'])

    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(findLabels(wrapper)).toEqual(['Field', 'Host', 'port'])
  })

  it('marks an optional object as such', () => {
    const wrapper = mountField({ schema })

    expect(wrapper.get('.optional').text()).toBe(t('optional'))
  })

  it('displays an optional object which is already filled', () => {
    const wrapper = mountField({ schema, modelValue: { host: 'example.org' } })

    expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('example.org')
  })

  it('closes an optional object reset from the outside', async () => {
    const wrapper = mountField({ schema, modelValue: { host: 'example.org' } })

    await wrapper.setProps({ modelValue: undefined })

    expect(wrapper.findAll('input[type="text"]')).toHaveLength(0)
  })

  it('initializes an optional object with its defaults when it is used', async () => {
    const wrapper = mountField({
      schema: { type: 'object', properties: { port: { type: 'integer', default: 25 } } },
    })

    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(lastEmittedValue(wrapper)).toEqual({ port: 25 })
  })

  it('closes an optional object opened without value when it is reset from the outside', async () => {
    const wrapper = mountField({ schema })

    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.setProps({ modelValue: lastEmittedValue(wrapper) })
    await wrapper.setProps({ modelValue: undefined })

    expect(wrapper.findAll('input[type="text"]')).toHaveLength(0)
  })

  it('clears an optional object when it is not used anymore', async () => {
    const wrapper = mountField({ schema, modelValue: { host: 'example.org' } })

    await wrapper.get('input[type="checkbox"]').setValue(false)

    expect(lastEmittedValue(wrapper)).toBeUndefined()
  })
})

describe('boolean field', () => {
  it('uses the default value until it is changed', () => {
    const wrapper = mountField({ schema: { type: 'boolean', default: true } })

    expect(wrapper.get<HTMLInputElement>('input[type="checkbox"]').element.checked).toBe(true)
  })

  it('prefers the current value over the default', () => {
    const wrapper = mountField({ schema: { type: 'boolean', default: true }, modelValue: false })

    expect(wrapper.get<HTMLInputElement>('input[type="checkbox"]').element.checked).toBe(false)
  })

  it('emits the checked value', async () => {
    const wrapper = mountField({ schema: { type: 'boolean' } })

    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(lastEmittedValue(wrapper)).toBe(true)
  })

  it('displays the label and the help text of the description', () => {
    const wrapper = mountField({ schema: { type: 'boolean', description: 'Check the certificate' }, label: 'TLS' })

    expect(wrapper.get('label').text()).toBe('TLS')
    expect(wrapper.get('.ui-info').text()).toBe('Check the certificate')
  })
})

describe('array field', () => {
  const schema: JsonSchema = { type: 'array', items: { type: 'string' } }

  it('renders a field per item', () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b'] })

    expect(wrapper.findAll('input').map(input => input.element.value)).toEqual(['a', 'b'])
  })

  it('labels the items without title by their position', () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b'] })

    expect(findLabels(wrapper)).toEqual([`${t('item')} 1`, `${t('item')} 2`])
  })

  it('labels the items with the title of their schema', () => {
    const wrapper = mountField({
      schema: { type: 'array', items: { type: 'string', title: 'URI' } },
      required: true,
      modelValue: ['a'],
    })

    expect(findLabels(wrapper)).toEqual(['URI 1'])
  })

  it('adds an item', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a'] })

    await getButton(wrapper, t('action:add')).trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual(['a', undefined])
  })

  it('adds an object item with its defaults', async () => {
    const wrapper = mountField({
      schema: { type: 'array', items: { type: 'object', properties: { port: { type: 'integer', default: 389 } } } },
      required: true,
      modelValue: [],
    })

    await getButton(wrapper, t('action:add')).trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual([{ port: 389 }])
  })

  it('does not mark simple items as required', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a'] })

    expect(await findRequiredLabels(wrapper)).toEqual([])
  })

  it('always displays the properties of an object item', () => {
    const wrapper = mountField({
      schema: { type: 'array', items: { type: 'object', properties: { uri: { type: 'string' } } } },
      required: true,
      modelValue: [{}],
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(findLabels(wrapper)).toEqual([`${t('item')} 1`, 'uri'])
  })

  it('removes an item', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b', 'c'] })

    await wrapper.findAll('button.ui-button-icon')[1].trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual(['a', 'c'])
  })

  it('updates an item', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b'] })

    await wrapper.findAll('input')[0].setValue('z')

    expect(lastEmittedValue(wrapper)).toEqual(['z', 'b'])
  })

  it('hides the items of an optional empty array until asked', async () => {
    const wrapper = mountField({ schema })

    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(lastEmittedValue(wrapper)).toEqual([])
  })
})

it('warns about unsupported fields', () => {
  const wrapper = mountField({ schema: { type: 'null' }, label: 'Smart mode' })

  expect(wrapper.text()).toBe(t('json-schema:unsupported-field', { label: 'Smart mode' }))
})
