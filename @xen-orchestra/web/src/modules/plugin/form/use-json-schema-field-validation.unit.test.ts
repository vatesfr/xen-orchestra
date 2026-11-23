import { useJsonSchemaFieldValidation } from '@/modules/plugin/form/use-json-schema-field-validation.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mountInJsonSchemaForm } from '@/test/mount-json-schema-form.ts'

const SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: { host: { type: 'string' }, port: { type: 'integer', minimum: 1 } },
      required: ['host'],
    },
  },
  required: ['server'],
}

function mountField(path: string[], initialValue: unknown = { server: {} }) {
  const { wrapper, result } = mountInJsonSchemaForm(SCHEMA, initialValue, () => useJsonSchemaFieldValidation(path))

  return { form: wrapper.vm, field: result }
}

describe('in a form', () => {
  it('gives the field the ID the form focuses when the field is invalid', () => {
    const { form, field } = mountField(['server', 'host'])

    expect(field.fieldId.value).toBe(form.errors[0].id)
  })

  it('shows no error until the field is left', () => {
    const { field } = mountField(['server', 'host'])

    expect(field.errorMessage.value).toBeUndefined()
  })

  it('shows the error of the field once it is left', () => {
    const { field } = mountField(['server', 'host'])

    field.touch()

    expect(field.errorMessage.value).toEqual({ content: t('form:error:required'), accent: 'danger' })
  })

  it('shows the broken constraint of the field', () => {
    const { field } = mountField(['server', 'port'], { server: { host: 'ldap.example.org', port: 0 } })

    field.touch()

    expect(field.errorMessage.value).toEqual({ content: t('form:error:minimum', { min: 1 }), accent: 'danger' })
  })

  it('counts the visible errors within the field once the form is submitted', () => {
    const { form, field } = mountField(['server'], { server: { port: 0 } })

    form.submit()

    expect(field.errorCount.value).toBe(2)
  })
})

describe('outside a form', () => {
  function mountAlone() {
    return mountComposable(() => useJsonSchemaFieldValidation(['host'])).wrapper.vm
  }

  it('has no ID, no error and no error count', () => {
    const field = mountAlone()

    expect(field.fieldId).toBeUndefined()
    expect(field.errorMessage).toBeUndefined()
    expect(field.errorCount).toBe(0)
  })

  it('ignores the field being left', () => {
    expect(() => mountAlone().touch()).not.toThrow()
  })
})
