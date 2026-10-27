import { IK_JSON_SCHEMA_FORM } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { t } from '@/test/i18n.ts'
import { getNumberedItemLabel } from '@/test/json-schema-item-label.ts'
import { mountInJsonSchemaForm } from '@/test/mount-json-schema-form.ts'
import { inject } from 'vue'

const SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    server: {
      type: 'object',
      title: 'Server',
      properties: { host: { type: 'string', title: 'Host' }, port: { type: 'integer' } },
      required: ['host', 'port'],
    },
    base: { type: 'string', title: 'Base' },
  },
  required: ['server', 'base'],
}

const VALID_VALUE = { server: { host: 'ldap.example.org', port: 389 }, base: 'dc=example,dc=org' }

function mountForm(schema: JsonSchema | undefined, initialValue: unknown) {
  const {
    wrapper,
    value,
    result: context,
  } = mountInJsonSchemaForm(schema, initialValue, () => inject(IK_JSON_SCHEMA_FORM))

  if (context === undefined) {
    throw new Error('the form context is not provided')
  }

  return { wrapper, value, context }
}

function findErrorMessages(errors: { message: string }[]) {
  return errors.map(error => error.message)
}

describe('errors', () => {
  it('lists the missing fields with the titles of their sections, or their key', () => {
    const { wrapper } = mountForm(SCHEMA, { server: {} })

    expect(findErrorMessages(wrapper.vm.errors)).toEqual(
      [
        t('json-schema:nested-label', { parent: 'Server', label: 'Host' }),
        t('json-schema:nested-label', { parent: 'Server', label: 'port' }),
        'Base',
      ].map(field => t('form:error:field-required', { field }))
    )
  })

  it('labels the items of an array without title by their position', () => {
    const { wrapper } = mountForm(
      { type: 'object', properties: { uris: { type: 'array', items: { type: 'string' } } } },
      { uris: [''] }
    )

    expect(findErrorMessages(wrapper.vm.errors)).toEqual([
      t('form:error:field-required', {
        field: t('json-schema:nested-label', {
          parent: 'uris',
          label: getNumberedItemLabel(1),
        }),
      }),
    ])
  })

  describe('constraints', () => {
    const constrainedSchema: JsonSchema = {
      type: 'object',
      properties: {
        port: { type: 'integer', title: 'Port', minimum: 1, maximum: 65535 },
        hosts: { type: 'array', title: 'Hosts', items: { type: 'string' }, minItems: 2 },
      },
    }

    function findMessages(initialValue: unknown) {
      const { wrapper } = mountForm(constrainedSchema, initialValue)

      return wrapper.vm.errors.map(({ fieldMessage, message }) => ({ fieldMessage, message }))
    }

    it.each([
      [
        'a decimal number given for an integer',
        { port: 1.5 },
        t('form:error:integer'),
        t('form:error:field-integer', { field: 'Port' }),
      ],
      [
        'a number under the minimum',
        { port: 0 },
        t('form:error:minimum', { min: 1 }),
        t('form:error:field-minimum', { field: 'Port', min: 1 }),
      ],
      [
        'a number over the maximum',
        { port: 65536 },
        t('form:error:maximum', { max: 65535 }),
        t('form:error:field-maximum', { field: 'Port', max: 65535 }),
      ],
      [
        'a list with too few items, pluralized with the minimum count',
        { hosts: ['ldap.example.org'] },
        t('form:error:min-items', { n: 2 }, 2),
        t('form:error:field-min-items', { field: 'Hosts', n: 2 }, 2),
      ],
    ])('reports %s', (_, initialValue, fieldMessage, message) => {
      expect(findMessages(initialValue)).toEqual([{ fieldMessage, message }])
    })
  })

  it('gives each missing field the ID of its field', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    expect(wrapper.vm.errors.map(error => error.id)).toEqual([
      context.getFieldId(['server', 'host']),
      context.getFieldId(['server', 'port']),
      context.getFieldId(['base']),
    ])
  })

  it('follows the value', () => {
    const { wrapper, value } = mountForm(SCHEMA, { server: {} })

    value.value = VALID_VALUE

    expect(wrapper.vm.errors).toEqual([])
  })

  it('has no errors without schema', () => {
    const { wrapper } = mountForm(undefined, undefined)

    expect(wrapper.vm.errors).toEqual([])
  })
})

describe('summaryErrors', () => {
  it('is empty until the form is submitted', () => {
    const { wrapper } = mountForm(SCHEMA, { server: {} })

    expect(wrapper.vm.summaryErrors).toEqual([])
  })
})

describe('submit', () => {
  it('shows all the errors', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(wrapper.vm.summaryErrors).toEqual(wrapper.vm.errors)
    expect(context.countVisibleErrors([])).toBe(3)
  })

  it('returns false for an invalid value', () => {
    const { wrapper } = mountForm(SCHEMA, { server: {} })

    expect(wrapper.vm.submit()).toBe(false)
  })

  it('returns true for a valid value', () => {
    const { wrapper } = mountForm(SCHEMA, VALID_VALUE)

    expect(wrapper.vm.submit()).toBe(true)
  })

  it('focuses the first missing field', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })
    document.body.innerHTML = `<div id="${context.getFieldId(['server', 'host'])}"><input /></div>`

    wrapper.vm.submit()

    expect(document.activeElement).toBe(document.querySelector('input'))
  })
})

describe('reset', () => {
  it('hides the errors shown by the validation', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()
    wrapper.vm.reset()

    expect(wrapper.vm.summaryErrors).toEqual([])
    expect(context.countVisibleErrors([])).toBe(0)
  })

  it('forgets the fields which were left', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])
    wrapper.vm.reset()

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })
})

describe('getFieldId', () => {
  it('gives a different ID to each field', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    expect(context.getFieldId(['server', 'host'])).not.toBe(context.getFieldId(['base']))
  })
})

describe('getVisibleError', () => {
  it('is undefined for a missing field which is not left yet', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })

  it('is the error of a missing field once it is left', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])

    expect(context.getVisibleError(['base'])?.fieldMessage).toBe(t('form:error:required'))
  })

  it('is undefined for a filled field which is left', () => {
    const { context } = mountForm(SCHEMA, { server: {}, base: 'dc=example,dc=org' })

    context.touch(['base'])

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })

  it('stays defined for a field left several times', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])
    context.touch(['base'])

    expect(context.getVisibleError(['base'])).toBeDefined()
  })

  it('is defined for every missing field once the form is validated', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(context.getVisibleError(['server', 'port'])).toBeDefined()
  })

  it('is undefined for a section containing a visible error', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(context.getVisibleError(['server'])).toBeUndefined()
  })
})

describe('countVisibleErrors', () => {
  it('counts no error until the fields are left', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    expect(context.countVisibleErrors([])).toBe(0)
  })

  it('counts the visible errors within a section', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    context.touch(['server', 'host'])
    context.touch(['base'])

    expect(context.countVisibleErrors(['server'])).toBe(1)
    expect(context.countVisibleErrors([])).toBe(2)
  })

  it('counts every error of a section once the form is validated', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(context.countVisibleErrors(['server'])).toBe(2)
  })
})
