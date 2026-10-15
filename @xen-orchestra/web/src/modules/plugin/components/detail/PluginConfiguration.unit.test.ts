import PluginConfiguration from '@/modules/plugin/components/detail/PluginConfiguration.vue'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaErrorSummary from '@/modules/plugin/json-schema-form/JsonSchemaErrorSummary.vue'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { flushPromises, mount } from '@vue/test-utils'

beforeEach(() => {
  vi.mocked(fetch).mockReset()
})

const SCHEMA = {
  type: 'object',
  properties: { host: { type: 'string' } },
  required: ['host'],
} satisfies JsonSchema

const configuredPlugin = createPlugin({
  id: 'transport-email' as FrontXoPlugin['id'],
  name: 'transport-email',
  configurationSchema: SCHEMA,
  configuration: { host: 'smtp.example.org' },
  configured: true,
})

const unconfiguredPlugin = createPlugin({
  id: 'transport-email' as FrontXoPlugin['id'],
  configurationSchema: SCHEMA,
  configuration: undefined,
  configured: false,
})

function mountCard(plugin: FrontXoPlugin = configuredPlugin) {
  return mount(PluginConfiguration, {
    props: { plugin },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

function findButton(wrapper: ReturnType<typeof mountCard>, label: string) {
  const button = wrapper.findAllComponents(UiButton).find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`no "${label}" button`)
  }

  return button
}

function hasButton(wrapper: ReturnType<typeof mountCard>, label: string) {
  return wrapper.findAllComponents(UiButton).some(button => button.text() === label)
}

function editConfiguration(wrapper: ReturnType<typeof mountCard>, configuration: unknown) {
  return wrapper.getComponent(JsonSchemaField).setValue(configuration)
}

async function save(wrapper: ReturnType<typeof mountCard>) {
  await findButton(wrapper, t('action:save')).trigger('click')
  await flushPromises()
}

function findRequests() {
  return vi.mocked(fetch).mock.calls.map(([url, init]) => ({ url, method: init?.method, body: init?.body }))
}

it('displays the saved configuration in a required form', () => {
  const wrapper = mountCard()

  expect(wrapper.getComponent(JsonSchemaField).props()).toMatchObject({
    schema: SCHEMA,
    modelValue: { host: 'smtp.example.org' },
    label: t('configuration'),
    required: true,
    disabled: false,
  })
})

it('explains that a plugin without schema is not configurable', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: undefined }))

  expect(wrapper.text()).toContain(t('plugin:not-configurable'))
  expect(wrapper.findComponent(JsonSchemaField).exists()).toBe(false)
  expect(hasButton(wrapper, t('action:save'))).toBe(false)
})

describe('presets', () => {
  it('offers the presets of the plugin', () => {
    const wrapper = mountCard(createPlugin({ ...configuredPlugin, configurationPresets: { gmail: { port: 587 } } }))

    expect(wrapper.text()).toContain(t('plugin:configuration-presets'))
    expect(hasButton(wrapper, t('action:apply'))).toBe(true)
  })

  it('offers no preset for a plugin without presets', () => {
    const wrapper = mountCard(createPlugin({ ...configuredPlugin, configurationPresets: undefined }))

    expect(wrapper.text()).not.toContain(t('plugin:configuration-presets'))
    expect(hasButton(wrapper, t('action:apply'))).toBe(false)
  })
})

describe('save', () => {
  it('saves the edited configuration', async () => {
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await save(wrapper)

    expect(findRequests()).toEqual([
      {
        url: '/rest/v0/plugins/transport-email/configuration',
        method: 'PUT',
        body: JSON.stringify({ host: 'smtp.example.com' }),
      },
    ])
  })

  it('cannot save the saved configuration again', () => {
    const wrapper = mountCard()

    expect(findButton(wrapper, t('action:save')).props('disabled')).toBe(true)
  })

  it('disables the form while the configuration is saved', async () => {
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await save(wrapper)

    expect(wrapper.getComponent(JsonSchemaField).props('disabled')).toBe(true)
  })

  it('displays the success of the save', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await save(wrapper)

    expect(wrapper.get('.feedback').text()).toContain(t('plugin:configuration-saved'))
  })

  it('displays the error of the save', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('invalid configuration'))
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await save(wrapper)

    const feedback = wrapper.get('.feedback').text()

    expect(feedback).toContain(t('plugin:configuration-failed'))
    expect(feedback).toContain('invalid configuration')
    expect(feedback).not.toContain(t('plugin:configuration-saved'))
  })

  it('displays no feedback before the configuration is saved', () => {
    const wrapper = mountCard()

    expect(wrapper.find('.feedback').exists()).toBe(false)
  })
})

describe('missing fields', () => {
  it('lists the missing fields instead of saving', async () => {
    const wrapper = mountCard(unconfiguredPlugin)

    await save(wrapper)

    expect(
      wrapper
        .getComponent(JsonSchemaErrorSummary)
        .props('errors')
        .map(error => error.path)
    ).toEqual([['host']])
    expect(findRequests()).toEqual([])
  })

  it('focuses the first missing field', async () => {
    const wrapper = mountCard(unconfiguredPlugin)

    await save(wrapper)

    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('offers to go to the first missing field', async () => {
    const wrapper = mountCard(unconfiguredPlugin)

    await save(wrapper)
    wrapper.get('input').element.blur()
    await findButton(wrapper, t('json-schema:go-to-first-of-n-errors', 1)).trigger('click')

    expect(document.activeElement).toBe(wrapper.get('input').element)
  })
})

describe('cancel', () => {
  it('restores the saved configuration', async () => {
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await findButton(wrapper, t('cancel')).trigger('click')

    expect(wrapper.getComponent(JsonSchemaField).props('modelValue')).toEqual({ host: 'smtp.example.org' })
  })

  it('cannot cancel when nothing changed', () => {
    const wrapper = mountCard()

    expect(findButton(wrapper, t('cancel')).props('disabled')).toBe(true)
  })
})

describe('configuration deletion', () => {
  it('asks to confirm the deletion of the configuration', async () => {
    const wrapper = mountCard()

    await findButton(wrapper, t('action:delete')).trigger('click')

    expect(useOverlayStore().overlays.map(overlay => overlay.props.subject)).toEqual([
      t('plugin:configuration-of', { name: 'transport-email' }),
    ])
  })

  it('cannot delete the configuration while it is saved', async () => {
    const wrapper = mountCard()

    await editConfiguration(wrapper, { host: 'smtp.example.com' })
    await save(wrapper)

    expect(findButton(wrapper, t('action:delete')).props('disabled')).toBe(true)
  })

  it('offers no deletion when no configuration is saved', () => {
    const wrapper = mountCard(unconfiguredPlugin)

    expect(hasButton(wrapper, t('action:delete'))).toBe(false)
  })
})
