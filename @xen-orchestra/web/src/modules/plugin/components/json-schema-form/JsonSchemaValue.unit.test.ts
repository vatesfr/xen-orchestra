import JsonSchemaValue from '@/modules/plugin/components/json-schema-form/JsonSchemaValue.vue'
import type { useXoObjectOptions } from '@/modules/plugin/composables/use-xo-object-options.composable.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { findLabelledValues, findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { mount } from '@vue/test-utils'
import { computed, toValue } from 'vue'

const { objectOptions } = vi.hoisted(() => ({
  objectOptions: vi.fn(),
}))

// The options come from the XO object collections, which subscribe to server events
vi.mock(import('@/modules/plugin/composables/use-xo-object-options.composable.ts'), () => ({
  useXoObjectOptions: objectOptions as unknown as typeof useXoObjectOptions,
}))

beforeEach(() => {
  objectOptions.mockReset()

  objectOptions.mockImplementation(rawType => ({
    options: computed(() => [{ value: `${toValue(rawType)}-1`, label: `Main ${toValue(rawType)}` }]),
    isReady: computed(() => true),
    hasError: computed(() => false),
  }))
})

function mountValue(properties: Record<string, JsonSchema>, value: unknown) {
  return mount(JsonSchemaValue, {
    props: { schema: { type: 'object', properties }, value },
    global: createGlobalTestConfig({ router: createTestRouter() }),
  })
}

it('shows each property of the schema with its value', () => {
  const wrapper = mountValue(
    { host: { type: 'string', title: 'Host' }, port: { type: 'integer', title: 'Port' } },
    { host: 'smtp.example.org' }
  )

  expect(findLabelledValues(wrapper)).toEqual({ Host: 'smtp.example.org', Port: '' })
})

it('titles a nested section with the labels of its parents', () => {
  const wrapper = mountValue(
    {
      transport: {
        type: 'object',
        title: 'Transport',
        properties: { auth: { type: 'object', title: 'Auth', properties: { user: { type: 'string' } } } },
      },
    },
    { transport: { auth: { user: 'xo' } } }
  )

  expect(wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())).toEqual([
    t('json-schema:nested-label', { parent: 'Transport', label: 'Auth' }),
  ])
})

it('hides the value of a secret', () => {
  const wrapper = mountValue({ password: { type: 'string', title: 'Password' } }, { password: 'hunter2' })

  expect(findLabelledValues(wrapper).Password).toBe('••••••••')
})

it('shows a boolean as a status', () => {
  const wrapper = mountValue({ secure: { type: 'boolean' } }, { secure: true })

  expect(wrapper.getComponent(VtsStatus).props('status')).toBe(true)
})

it.each([
  { type: 'host', routeName: '/host/[id]/dashboard' },
  { type: 'pool', routeName: '/pool/[id]/dashboard' },
  { type: 'sr', routeName: '/sr/[id]/general' },
  { type: 'vm', routeName: '/vm/[id]/dashboard' },
])('links a $type to its page, by its name', ({ type, routeName }) => {
  const link = mountValue({ object: { type: 'string', $type: type } }, { object: `${type}-1` }).getComponent(UiLink)

  expect(link.text()).toBe(`Main ${type}`)
  expect(link.props()).toMatchObject({ icon: `object:${type}`, to: { name: routeName, params: { id: `${type}-1` } } })
})

it('shows the ID of an unknown XO object', () => {
  const wrapper = mountValue({ vm: { type: 'string', $type: 'VM' } }, { vm: 'vm-2' })

  expect(wrapper.getComponent(UiLink).text()).toBe('vm-2')
})

it('shows the items of an array one per line', () => {
  const wrapper = mountValue(
    { uris: { type: 'array', title: 'URIs', items: { type: 'string' } } },
    { uris: ['ldap://a.example.org', 'ldap://b.example.org'] }
  )

  expect(wrapper.findAll('.list > span').map(item => item.text())).toEqual([
    'ldap://a.example.org',
    'ldap://b.example.org',
  ])
})

it('shows tags as tags', () => {
  const wrapper = mountValue({ tags: { type: 'array', items: { type: 'string', $type: 'Tag' } } }, { tags: ['prod'] })

  expect(findTags(wrapper)).toEqual(['prod'])
  expect(wrapper.findComponent(UiLink).exists()).toBe(false)
})
