import JsonSchemaExamples from '@/modules/plugin/components/json-schema-form/JsonSchemaExamples.vue'
import type { JsonSchemaExampleGroup } from '@/modules/plugin/utils/json-schema-description.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountExamples(groups: JsonSchemaExampleGroup[]) {
  return mount(JsonSchemaExamples, { props: { groups }, global: createGlobalTestConfig() })
}

function findExampleButtons(wrapper: ReturnType<typeof mountExamples>) {
  return wrapper.findAll('.values button')
}

function findExamples(wrapper: ReturnType<typeof mountExamples>) {
  return findExampleButtons(wrapper).map(button => button.text())
}

function findToggleButton(wrapper: ReturnType<typeof mountExamples>) {
  return wrapper.findAll('button').find(button => !button.element.closest('.values'))
}

const MANY_EXAMPLES: JsonSchemaExampleGroup[] = [
  { values: ['ldap://ldap.example.org'] },
  { caption: 'Using a secure connection', values: ['ldaps://ldap.example.org', 'ldaps://ldap.example.org:636'] },
]

it('displays a few examples directly', () => {
  const wrapper = mountExamples([{ values: ['foo', 'bar'] }])

  expect(findExamples(wrapper)).toEqual(['foo', 'bar'])
  expect(findToggleButton(wrapper)).toBeUndefined()
})

it('displays a few examples directly, whatever their groups', () => {
  const wrapper = mountExamples([{ values: ['foo'] }, { caption: 'Or', values: ['bar'] }])

  expect(findExamples(wrapper)).toEqual(['foo', 'bar'])
  expect(findToggleButton(wrapper)).toBeUndefined()
})

it('emits the picked example', async () => {
  const wrapper = mountExamples([{ values: ['foo', 'bar'] }])

  await findExampleButtons(wrapper)[1].trigger('click')

  expect(wrapper.emitted('pick')).toEqual([['bar']])
})

it('collapses many examples, with their count', () => {
  const wrapper = mountExamples(MANY_EXAMPLES)

  expect(findExamples(wrapper)).toEqual([])
  expect(findToggleButton(wrapper)?.text()).toBe(t('json-schema:show-examples-n', 3))
})

it('expands and collapses many examples, with the captions of their groups', async () => {
  const wrapper = mountExamples(MANY_EXAMPLES)

  await findToggleButton(wrapper)?.trigger('click')

  expect(findExamples(wrapper)).toEqual([
    'ldap://ldap.example.org',
    'ldaps://ldap.example.org',
    'ldaps://ldap.example.org:636',
  ])
  expect(wrapper.findAll('.caption').map(caption => caption.text())).toEqual(['Using a secure connection'])
  expect(findToggleButton(wrapper)?.text()).toBe(t('json-schema:hide-examples'))

  await findToggleButton(wrapper)?.trigger('click')

  expect(findExamples(wrapper)).toEqual([])
})
