import JsonSchemaErrorSummary from '@/modules/plugin/json-schema-form/JsonSchemaErrorSummary.vue'
import type { JsonSchemaFormError } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const ERRORS: JsonSchemaFormError[] = [
  { path: ['server', 'host'], id: 'field-host', label: 'Server › host' },
  { path: ['bind', 'password'], id: 'field-password', label: 'Bind › password' },
]

function mountSummary(errors = ERRORS) {
  return mount(JsonSchemaErrorSummary, { props: { errors }, global: createGlobalTestConfig() })
}

function renderFields() {
  document.body.innerHTML = '<div id="field-host"><input /></div><div id="field-password"><input /></div>'
}

afterEach(() => {
  document.body.innerHTML = ''
})

it('counts the errors in its title', () => {
  const wrapper = mountSummary()

  expect(wrapper.text()).toContain(t('json-schema:n-errors-summary', 2))
})

it('lists the missing fields', () => {
  const wrapper = mountSummary()

  expect(wrapper.findAll('li').map(item => item.text())).toEqual([
    t('form:error:field-required', { field: 'Server › host' }),
    t('form:error:field-required', { field: 'Bind › password' }),
  ])
})

it('focuses a missing field when it is clicked', async () => {
  renderFields()
  const wrapper = mountSummary()

  await wrapper.findAll('li button')[1].trigger('click')

  expect(document.activeElement).toBe(document.querySelector('#field-password input'))
})
