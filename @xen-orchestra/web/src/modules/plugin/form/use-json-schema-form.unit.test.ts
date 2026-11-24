import { IK_JSON_SCHEMA_FORM } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { t } from '@/test/i18n.ts'
import { getNumberedItemLabel } from '@/test/json-schema-item-label.ts'
import { mountInJsonSchemaForm } from '@/test/mount-json-schema-form.ts'
import { injectOrThrow } from '@core-test/inject-or-throw.ts'

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
    form,
    value,
    result: context,
  } = mountInJsonSchemaForm(schema, initialValue, () => injectOrThrow(IK_JSON_SCHEMA_FORM))

  return { form, value, context }
}

// SCHEMA with its required fields left empty
function mountIncompleteForm() {
  return mountForm(SCHEMA, { server: {} })
}

function findErrorMessages(errors: { message: string }[]) {
  return errors.map(error => error.message)
}

describe('errors', () => {
  it('lists the missing fields with the titles of their sections, or their key', () => {
    const { form } = mountIncompleteForm()

    expect(findErrorMessages(form.errors.value)).toEqual(
      [
        t('json-schema:nested-label', { parent: 'Server', label: 'Host' }),
        t('json-schema:nested-label', { parent: 'Server', label: 'port' }),
        'Base',
      ].map(field => t('form:error:field-required', { field }))
    )
  })

  it('labels the items of an array without title by their position', () => {
    const { form } = mountForm(
      { type: 'object', properties: { uris: { type: 'array', items: { type: 'string' } } } },
      { uris: [''] }
    )

    expect(findErrorMessages(form.errors.value)).toEqual([
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
      const { form } = mountForm(constrainedSchema, initialValue)

      return form.errors.value.map(({ fieldMessage, message }) => ({ fieldMessage, message }))
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
    const { form, context } = mountIncompleteForm()

    expect(form.errors.value.map(error => error.id)).toEqual([
      context.getFieldId(['server', 'host']),
      context.getFieldId(['server', 'port']),
      context.getFieldId(['base']),
    ])
  })

  it('follows the value', () => {
    const { form, value } = mountIncompleteForm()

    value.value = VALID_VALUE

    expect(form.errors.value).toEqual([])
  })

  it('has no errors without schema', () => {
    const { form } = mountForm(undefined, undefined)

    expect(form.errors.value).toEqual([])
  })
})

describe('summaryErrors', () => {
  it('is empty until the form is submitted', () => {
    const { form } = mountIncompleteForm()

    expect(form.summaryErrors.value).toEqual([])
  })
})

describe('submit', () => {
  it('shows all the errors', () => {
    const { form, context } = mountIncompleteForm()

    form.submit()

    expect(form.summaryErrors.value).toEqual(form.errors.value)
    expect(context.countVisibleErrors([])).toBe(3)
  })

  it('returns false for an invalid value', () => {
    const { form } = mountIncompleteForm()

    expect(form.submit()).toBe(false)
  })

  it('returns true for a valid value', () => {
    const { form } = mountForm(SCHEMA, VALID_VALUE)

    expect(form.submit()).toBe(true)
  })

  it('focuses the first missing field', () => {
    const { form, context } = mountIncompleteForm()
    document.body.innerHTML = `<div id="${context.getFieldId(['server', 'host'])}"><input /></div>`

    form.submit()

    expect(document.activeElement).toBe(document.querySelector('input'))
  })
})

describe('reset', () => {
  it('hides the errors shown by the validation', () => {
    const { form, context } = mountIncompleteForm()

    form.submit()
    form.reset()

    expect(form.summaryErrors.value).toEqual([])
    expect(context.countVisibleErrors([])).toBe(0)
  })

  it('forgets the fields which were left', () => {
    const { form, context } = mountIncompleteForm()

    context.touch(['base'])
    form.reset()

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })
})

describe('getFieldId', () => {
  it('gives a different ID to each field', () => {
    const { context } = mountIncompleteForm()

    expect(context.getFieldId(['server', 'host'])).not.toBe(context.getFieldId(['base']))
  })
})

describe('getVisibleError', () => {
  it('is undefined for a missing field which is not left yet', () => {
    const { context } = mountIncompleteForm()

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })

  it('is the error of a missing field once it is left', () => {
    const { context } = mountIncompleteForm()

    context.touch(['base'])

    expect(context.getVisibleError(['base'])?.fieldMessage).toBe(t('form:error:required'))
  })

  it('is undefined for a filled field which is left', () => {
    const { context } = mountForm(SCHEMA, { server: {}, base: 'dc=example,dc=org' })

    context.touch(['base'])

    expect(context.getVisibleError(['base'])).toBeUndefined()
  })

  it('stays defined for a field left several times', () => {
    const { context } = mountIncompleteForm()

    context.touch(['base'])
    context.touch(['base'])

    expect(context.getVisibleError(['base'])).toBeDefined()
  })

  it('is defined for every missing field once the form is validated', () => {
    const { form, context } = mountIncompleteForm()

    form.submit()

    expect(context.getVisibleError(['server', 'port'])).toBeDefined()
  })

  it('is undefined for a section containing a visible error', () => {
    const { form, context } = mountIncompleteForm()

    form.submit()

    expect(context.getVisibleError(['server'])).toBeUndefined()
  })
})

describe('countVisibleErrors', () => {
  it('counts no error until the fields are left', () => {
    const { context } = mountIncompleteForm()

    expect(context.countVisibleErrors([])).toBe(0)
  })

  it('counts the visible errors within a section', () => {
    const { context } = mountIncompleteForm()

    context.touch(['server', 'host'])
    context.touch(['base'])

    expect(context.countVisibleErrors(['server'])).toBe(1)
    expect(context.countVisibleErrors([])).toBe(2)
  })

  it('counts every error of a section once the form is validated', () => {
    const { form, context } = mountIncompleteForm()

    form.submit()

    expect(context.countVisibleErrors(['server'])).toBe(2)
  })
})
