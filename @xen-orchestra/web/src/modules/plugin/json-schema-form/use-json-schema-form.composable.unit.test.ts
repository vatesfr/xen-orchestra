import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import {
  IK_JSON_SCHEMA_FORM,
  useJsonSchemaForm,
} from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h, inject, type InjectionKey, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type JsonSchemaFormContext = typeof IK_JSON_SCHEMA_FORM extends InjectionKey<infer TContext> ? TContext : never

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
  const value = ref(initialValue)
  let context: JsonSchemaFormContext | undefined

  const Field = defineComponent({
    setup() {
      context = inject(IK_JSON_SCHEMA_FORM)

      return () => null
    },
  })

  const wrapper = mount(
    defineComponent({
      setup: () => ({ ...useJsonSchemaForm(schema, value), t: useI18n().t }),
      render: () => h(Field),
    }),
    { global: createGlobalTestConfig() }
  )

  if (context === undefined) {
    throw new Error('the form context is not provided')
  }

  return { wrapper, value, context }
}

function findErrorLabels(errors: { label: string }[]) {
  return errors.map(error => error.label)
}

describe('errors', () => {
  it('lists the missing fields with the titles of their sections, or their key', () => {
    const { wrapper } = mountForm(SCHEMA, { server: {} })

    const { t } = wrapper.vm

    expect(findErrorLabels(wrapper.vm.errors)).toEqual([
      t('json-schema:nested-label', { parent: 'Server', label: 'Host' }),
      t('json-schema:nested-label', { parent: 'Server', label: 'port' }),
      'Base',
    ])
  })

  it('labels the items of an array without title by their position', () => {
    const { wrapper } = mountForm(
      { type: 'object', properties: { uris: { type: 'array', items: { type: 'string' } } } },
      { uris: [''] }
    )

    const { t } = wrapper.vm

    expect(findErrorLabels(wrapper.vm.errors)).toEqual([
      t('json-schema:nested-label', {
        parent: 'uris',
        label: t('json-schema:numbered-item', { label: t('item'), n: 1 }),
      }),
    ])
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

describe('submit', () => {
  it('shows all the errors', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(wrapper.vm.isSubmitted).toBe(true)
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

    expect(wrapper.vm.isSubmitted).toBe(false)
    expect(context.countVisibleErrors([])).toBe(0)
  })

  it('forgets the fields which were left', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])
    wrapper.vm.reset()

    expect(context.hasVisibleError(['base'])).toBe(false)
  })
})

describe('getFieldId', () => {
  it('gives a different ID to each field', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    expect(context.getFieldId(['server', 'host'])).not.toBe(context.getFieldId(['base']))
  })
})

describe('hasVisibleError', () => {
  it('is false for a missing field which is not left yet', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    expect(context.hasVisibleError(['base'])).toBe(false)
  })

  it('is true for a missing field once it is left', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])

    expect(context.hasVisibleError(['base'])).toBe(true)
  })

  it('is false for a filled field which is left', () => {
    const { context } = mountForm(SCHEMA, { server: {}, base: 'dc=example,dc=org' })

    context.touch(['base'])

    expect(context.hasVisibleError(['base'])).toBe(false)
  })

  it('stays true for a field left several times', () => {
    const { context } = mountForm(SCHEMA, { server: {} })

    context.touch(['base'])
    context.touch(['base'])

    expect(context.hasVisibleError(['base'])).toBe(true)
  })

  it('is true for every missing field once the form is validated', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(context.hasVisibleError(['server', 'port'])).toBe(true)
  })

  it('is false for a section containing a visible error', () => {
    const { wrapper, context } = mountForm(SCHEMA, { server: {} })

    wrapper.vm.submit()

    expect(context.hasVisibleError(['server'])).toBe(false)
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
