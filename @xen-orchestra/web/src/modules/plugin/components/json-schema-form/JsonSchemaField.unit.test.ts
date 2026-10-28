import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { OBFUSCATED_VALUE } from '@/shared/constants.ts'
import { createVm } from '@/test/create-vm.ts'
import { getButton } from '@/test/get-button.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { getNumberedItemLabel } from '@/test/json-schema-item-label.ts'
import { mountJsonSchemaForm } from '@/test/mount-json-schema-form.ts'
import { findSelectOptionLabels, openSelect, pickSelectOption } from '@/test/select.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'

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

// The pools fail to load, to test a field without options
vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([]),
    arePoolsReady: ref(false),
    hasPoolFetchError: ref(true),
  })) as unknown as typeof useXoPoolCollection,
}))

// The SRs never load, to test a field waiting for its options
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

function findLabels(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('label').map(label => label.text())
}

// An input wrapper learns that its input is required once the input is mounted
async function findRequiredLabels(wrapper: VueWrapper) {
  await nextTick()

  return wrapper.findAll('label.required').map(label => label.text())
}

function findSectionHeaders(wrapper: VueWrapper) {
  return wrapper.findAll('.json-schema-fieldset.section > .header')
}

function findSelectedLabel(wrapper: VueWrapper) {
  return wrapper.get('.vts-select').text()
}

function mountForm(schema: JsonSchema, modelValue: unknown) {
  return mountJsonSchemaForm(schema, modelValue, value =>
    h(JsonSchemaField, { schema, label: 'Form', required: true, modelValue: value.value })
  ).wrapper
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

  it('keeps hiding a secret obfuscated by the API once edited', async () => {
    const wrapper = mountField({ schema: { type: 'string' }, path: ['clientSecret'], modelValue: OBFUSCATED_VALUE })

    await wrapper.setProps({ modelValue: 'new secret' })

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

    expect(wrapper.get('.ui-info').text()).toBe('ID attribute. e.g.: dn')
  })

  it('highlights the code spans of the description', () => {
    const wrapper = mountField({ schema: { type: 'string', description: 'ID attribute. e.g.: `dn`' } })

    expect(wrapper.findAll('.ui-info code').map(code => code.text())).toEqual(['dn'])
  })
})

describe('string field helpers', () => {
  it('fills the value with an example', async () => {
    const wrapper = mountField({ schema: { type: 'string', description: 'ID attribute:\n\n- `dn`' } })

    await getButton(wrapper, 'dn').trigger('click')

    expect(lastEmittedValue(wrapper)).toBe('dn')
  })

  it('fills a numeric value with an example as a number', async () => {
    const wrapper = mountField({ schema: { type: 'integer', description: 'Port:\n\n- `587`' } })

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
    const wrapper = mountForm(schema, {})

    expect(findFieldsInError(wrapper)).toEqual([])

    await wrapper.get('input[type="text"]').trigger('focusout')

    expect(findFieldsInError(wrapper)).toEqual(['uri'])
  })

  it('displays all the errors once validated, with their count in the sections', async () => {
    const wrapper = mountForm(schema, { bind: {} })

    wrapper.vm.submit()
    await wrapper.vm.$nextTick()

    expect(findFieldsInError(wrapper)).toEqual(['uri', 'dn'])
    expect(wrapper.findAll('.ui-counter').map(counter => counter.text())).toEqual(['1'])
  })

  it('does not count the errors of a section until they are displayed', () => {
    const wrapper = mountForm(schema, { bind: {} })

    expect(wrapper.find('.ui-counter').exists()).toBe(false)
  })

  it('gives each field the ID of its error, so that the error summary can focus it', () => {
    const wrapper = mountForm(schema, { bind: {} })

    expect(wrapper.vm.errors.map(error => wrapper.find(`[id="${error.id}"] input`).exists())).toEqual([true, true])
  })

  it('displays the error of an XO object field whose options are loading, and gives it its ID', async () => {
    const wrapper = mountForm(
      { type: 'object', properties: { sr: { type: 'string', $type: 'SR' } }, required: ['sr'] },
      {}
    )

    wrapper.vm.submit()
    await nextTick()

    expect(findFieldsInError(wrapper)).toEqual(['sr'])
    expect(wrapper.find(`[id="${wrapper.vm.errors[0].id}"]`).exists()).toBe(true)
  })

  it('displays the error of a list under its section', async () => {
    const wrapper = mountForm(
      { type: 'object', properties: { hosts: { type: 'array', items: { type: 'string' }, minItems: 2 } } },
      { hosts: ['a'] }
    )

    wrapper.vm.submit()
    await nextTick()

    expect(findSectionHeaders(wrapper)[0].get('.ui-info').text()).toBe(t('form:error:min-items', { n: 2 }, 2))
  })

  it('displays the error of a field under its description', async () => {
    const wrapper = mountForm(
      { type: 'object', properties: { uri: { type: 'string', description: 'The LDAP URI' } }, required: ['uri'] },
      {}
    )

    await wrapper.get('input').trigger('focusout')

    expect(wrapper.findAll('.vts-input-wrapper .ui-info').map(info => info.text())).toEqual([
      'The LDAP URI',
      t('form:error:required'),
    ])
  })

  it('validates a filled form', () => {
    const wrapper = mountForm(schema, { uri: 'ldap://foo' })

    expect(wrapper.vm.submit()).toBe(true)
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

  const enumSchema: JsonSchema = { type: 'string', enum: ['ldap', 'ldaps'], enumNames: ['LDAP', 'LDAP over TLS'] }

  it('offers to unset an optional value', async () => {
    const wrapper = mountField({ schema: enumSchema, modelValue: 'ldaps' })

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual([t('none'), 'LDAP', 'LDAP over TLS'])

    await pickSelectOption(wrapper, t('none'))

    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })

  it('offers no empty option for a required value', async () => {
    const wrapper = mountField({ schema: enumSchema, required: true, modelValue: 'ldaps' })

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual(['LDAP', 'LDAP over TLS'])
  })
})

describe('XO object field', () => {
  it('displays the name of the referenced object', () => {
    const wrapper = mountField({ schema: { type: 'string', $type: 'VM' }, modelValue: 'vm-1' })

    expect(findSelectedLabel(wrapper)).toBe('Web server')
  })

  const vmListSchema: JsonSchema = { type: 'array', items: { type: 'string', $type: 'VM' } }

  it('picks a list of objects, without empty option', async () => {
    const wrapper = mountField({ schema: vmListSchema })

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual(['Web server'])

    await pickSelectOption(wrapper, 'Web server')

    expect(lastEmittedValue(wrapper)).toEqual(['vm-1'])
  })

  it('leaves an unset list unset until an object is picked', async () => {
    const wrapper = mountField({ schema: vmListSchema })

    expect(findSelectedLabel(wrapper)).toBe('')

    await openSelect(wrapper)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('waits for the objects to load', () => {
    const wrapper = mountField({ schema: { type: 'string', $type: 'SR' } })

    expect(wrapper.find('.ui-loader').exists()).toBe(true)
    expect(wrapper.find('.vts-select').exists()).toBe(false)
  })

  it('explains that the objects could not be loaded', () => {
    const wrapper = mountField({ schema: { type: 'string', $type: 'pool', description: 'The pool to watch' } })

    expect(wrapper.find('.ui-loader').exists()).toBe(false)
    expect(wrapper.text()).toContain(t('error-no-data'))
    expect(wrapper.text()).not.toContain('The pool to watch')
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

    await getCheckbox(wrapper, 'Field').setValue(true)

    expect(findLabels(wrapper)).toEqual(['Field', 'Host', 'port'])
  })

  it('marks an optional object as such', () => {
    const wrapper = mountField({ schema })

    expect(wrapper.get('.optional').text()).toBe(t('optional'))
  })

  it('labels an optional object by the checkbox which uses it', () => {
    const wrapper = mountField({ schema })
    const labelId = wrapper.get('[role="group"]').attributes('aria-labelledby')

    expect(getCheckbox(wrapper, 'Field').element.closest(`#${labelId}`)).not.toBeNull()
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

    await getCheckbox(wrapper, 'Field').setValue(true)

    expect(lastEmittedValue(wrapper)).toEqual({ port: 25 })
  })

  it('closes an optional object opened without value when it is reset from the outside', async () => {
    const wrapper = mountField({ schema })

    await getCheckbox(wrapper, 'Field').setValue(true)
    await wrapper.setProps({ modelValue: lastEmittedValue(wrapper) })
    await wrapper.setProps({ modelValue: undefined })

    expect(wrapper.findAll('input[type="text"]')).toHaveLength(0)
  })

  it('clears an optional object when it is not used anymore', async () => {
    const wrapper = mountField({ schema, modelValue: { host: 'example.org' } })

    await getCheckbox(wrapper, 'Field').setValue(false)

    expect(lastEmittedValue(wrapper)).toBeUndefined()
  })

  it('shows only the description of the root object, which is labelled by its container', () => {
    const wrapper = mountField({
      schema: { type: 'object', description: 'The server settings', properties: { host: { type: 'string' } } },
      required: true,
    })

    expect(wrapper.find('.json-schema-fieldset.section').exists()).toBe(false)
    expect(wrapper.get('.json-schema-fieldset > .header').text()).toBe('The server settings')
  })

  it('groups the consecutive booleans', () => {
    const wrapper = mountField({
      schema: {
        type: 'object',
        properties: {
          tls: { type: 'boolean' },
          verbose: { type: 'boolean' },
          host: { type: 'string' },
        },
      },
      required: true,
    })

    expect(wrapper.findAll('.group.booleans').map(group => findLabels(group))).toEqual([['tls', 'verbose']])
  })
})

describe('boolean field', () => {
  it('uses the default value until it is changed', () => {
    const wrapper = mountField({ schema: { type: 'boolean', default: true } })

    expect(getCheckbox(wrapper, 'Field').element.checked).toBe(true)
  })

  it('prefers the current value over the default', () => {
    const wrapper = mountField({ schema: { type: 'boolean', default: true }, modelValue: false })

    expect(getCheckbox(wrapper, 'Field').element.checked).toBe(false)
  })

  it('emits the checked value', async () => {
    const wrapper = mountField({ schema: { type: 'boolean' } })

    await getCheckbox(wrapper, 'Field').setValue(true)

    expect(lastEmittedValue(wrapper)).toBe(true)
  })

  it('displays the label and the help text of the description', () => {
    const wrapper = mountField({ schema: { type: 'boolean', description: 'Check the certificate' }, label: 'TLS' })

    expect(wrapper.get('.ui-checkbox').text()).toBe('TLS')
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

    expect(findLabels(wrapper)).toEqual([getNumberedItemLabel(1), getNumberedItemLabel(2)])
  })

  it('labels the items with the title of their schema', () => {
    const wrapper = mountField({
      schema: { type: 'array', items: { type: 'string', title: 'URI' } },
      required: true,
      modelValue: ['a'],
    })

    expect(findLabels(wrapper)).toEqual([getNumberedItemLabel(1, 'URI')])
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

    expect(wrapper.find('.ui-checkbox').exists()).toBe(false)
    expect(findLabels(wrapper)).toEqual([getNumberedItemLabel(1), 'uri'])
  })

  it('removes an item', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b', 'c'] })

    await wrapper.findAll('button.ui-button-icon')[1].trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual(['a', 'c'])
  })

  it('removes an object item from its header', async () => {
    const wrapper = mountField({
      schema: { type: 'array', items: { type: 'object', properties: { uri: { type: 'string' } } } },
      required: true,
      modelValue: [{ uri: 'a' }, { uri: 'b' }],
    })

    await findSectionHeaders(wrapper)[0].get('button.ui-button-icon').trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual([{ uri: 'b' }])
  })

  it('keeps the state of the following items when an item is removed', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', OBFUSCATED_VALUE] })

    await wrapper.findAll('button.ui-button-icon')[0].trigger('click')
    await wrapper.setProps({ modelValue: lastEmittedValue(wrapper) })

    expect(wrapper.findAll('input').map(input => input.element.type)).toEqual(['password'])
  })

  it('resets the state of the items when the list is replaced from the outside', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: [OBFUSCATED_VALUE, 'b'] })

    await wrapper.setProps({ modelValue: ['a'] })

    expect(wrapper.findAll('input').map(input => input.element.type)).toEqual(['text'])
  })

  it('adds an item to a list without item schema', async () => {
    const wrapper = mountField({ schema: { type: 'array' }, required: true, modelValue: [] })

    await getButton(wrapper, t('action:add')).trigger('click')

    expect(lastEmittedValue(wrapper)).toEqual([undefined])
  })

  it('updates an item', async () => {
    const wrapper = mountField({ schema, required: true, modelValue: ['a', 'b'] })

    await wrapper.findAll('input')[0].setValue('z')

    expect(lastEmittedValue(wrapper)).toEqual(['z', 'b'])
  })

  it('hides the items of an optional empty array until asked', async () => {
    const wrapper = mountField({ schema })

    expect(wrapper.find('button').exists()).toBe(false)

    await getCheckbox(wrapper, 'Field').setValue(true)

    expect(lastEmittedValue(wrapper)).toEqual([])
  })
})

it('warns about unsupported fields', () => {
  const wrapper = mountField({ schema: { type: 'null' }, label: 'Smart mode' })

  expect(wrapper.text()).toBe(t('json-schema:unsupported-field', { label: 'Smart mode' }))
})
