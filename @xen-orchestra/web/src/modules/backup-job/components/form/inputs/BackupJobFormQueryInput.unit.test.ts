import BackupJobFormQueryInput from '@/modules/backup-job/components/form/inputs/BackupJobFormQueryInput.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

function mountQueryInput(initialFilter = '') {
  const filter = ref(initialFilter)

  const wrapper = mount(
    defineComponent(() => {
      const schema = useQueryBuilderSchema<{ name_label: string }>({
        '': useStringSchema('Any property'),
        name_label: useStringSchema('Name'),
      })

      return () =>
        h(BackupJobFormQueryInput, {
          label: 'Dynamic selection query',
          schema,
          modelValue: filter.value,
          'onUpdate:modelValue': (value: string) => (filter.value = value),
        })
    }),
    { global: createGlobalTestConfig() }
  )

  return { wrapper, filter }
}

function getInput(wrapper: VueWrapper) {
  return wrapper.get<HTMLInputElement>('.ui-input input')
}

it('shows the query of its model', () => {
  const { wrapper } = mountQueryInput('name_label:web')

  expect(getInput(wrapper).element.value).toBe('name_label:web')
})

it('keeps its model while the query is being typed', async () => {
  const { wrapper, filter } = mountQueryInput('name_label:web')

  await getInput(wrapper).setValue('name_label:db')

  expect(filter.value).toBe('name_label:web')
})

it('applies the typed query with the Enter key', async () => {
  const { wrapper, filter } = mountQueryInput()

  await getInput(wrapper).setValue('name_label:db')
  await getInput(wrapper).trigger('keydown', { key: 'Enter' })

  expect(filter.value).toBe('name_label:db')
})

it('clears the query', async () => {
  const { wrapper, filter } = mountQueryInput('name_label:web')

  await wrapper.get('.ui-input button').trigger('click')

  expect(filter.value).toBe('')
})

it('shows the error', () => {
  const wrapper = mount(BackupJobFormQueryInput, {
    props: {
      label: 'Dynamic selection query',
      schema: {},
      modelValue: '',
      error: { content: 'Query is mandatory.', accent: 'danger' },
    },
    global: createGlobalTestConfig(),
  })

  expect(wrapper.findAll('.ui-info').map(message => message.text())).toEqual(['Query is mandatory.'])
})
