import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'
import { configure } from '@xen-orchestra/log/configure'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { OBFUSCATED_VALUE } from '@vates/obfuscate'

import Plugins from './plugins.mjs'

configure({ level: 'FATAL', transport: () => {} })

// an empty configuration is invalid
const REQUIRED_SCHEMA = {
  type: 'object',
  properties: { host: { type: 'string' }, password: { type: 'string' } },
  required: ['host'],
}

// an empty configuration is valid
const OPTIONAL_SCHEMA = {
  type: 'object',
  properties: { host: { type: 'string' } },
}

const createInstance = ({ testable = false, unloadable = true } = {}) => {
  const calls = []
  const instance = {
    configure: async (configuration, context) => calls.push(['configure', configuration, context]),
    load: async () => calls.push(['load']),
  }
  if (testable) {
    instance.test = async data => calls.push(['test', data])
  }
  if (unloadable) {
    instance.unload = async () => calls.push(['unload'])
  }
  return { calls, instance }
}

// `_pluginsMetadata` is normally created on the `core started` hook, backed by Redis
const createPlugins = (initialMetadata = {}) => {
  const touched = []
  const app = {
    hooks: new EventEmitter(),
    touchXoObject: async (type, id) => {
      assert.equal(type, 'plugin')
      touched.push(id)
    },
  }
  const plugins = new Plugins(app)

  const stored = { __proto__: null }
  for (const [id, metadata] of Object.entries(initialMetadata)) {
    stored[id] = { id, ...metadata }
  }

  plugins._pluginsMetadata = {
    first: async id => (stored[id] === undefined ? undefined : { ...stored[id] }),
    update: async metadata => {
      stored[metadata.id] = { ...metadata }
    },
    merge: async (id, data) => {
      if (stored[id] === undefined) {
        throw new Error('no such plugin metadata')
      }
      stored[id] = { ...stored[id], ...data }
    },
  }

  return { app, plugins, stored, touched }
}

const register = (plugins, name, { configurationSchema, instance, testSchema } = {}) =>
  plugins.registerPlugin(
    name,
    instance,
    configurationSchema,
    undefined,
    'description',
    ['keyword'],
    testSchema,
    '1.0.0'
  )

const isInvalidParameters = error => invalidParameters.is(error)

describe('Plugins', () => {
  describe('registerPlugin()', () => {
    it('loads a non configurable plugin without configuring it', async () => {
      const { plugins, stored } = createPlugins()
      const { calls, instance } = createInstance()

      await register(plugins, 'foo', { instance })

      const plugin = await plugins.getPlugin('foo')
      assert.equal(plugin.configured, true)
      assert.equal(plugin.loaded, true)
      assert.deepEqual(
        calls.map(([name]) => name),
        ['load']
      )
      // first registration: the metadata are created with autoload enabled
      assert.equal(stored.foo.autoload, true)
    })

    it('configures with an empty configuration when it is valid', async () => {
      const { plugins } = createPlugins()
      const { calls, instance } = createInstance()

      await register(plugins, 'foo', { configurationSchema: OPTIONAL_SCHEMA, instance })

      const plugin = await plugins.getPlugin('foo')
      assert.equal(plugin.configured, true)
      assert.equal(plugin.loaded, true)
      assert.equal(plugin.configuration, undefined)
      assert.deepEqual(calls[0], ['configure', {}, { loaded: undefined }])
    })

    it('neither configures nor loads when the empty configuration is invalid', async () => {
      const { plugins } = createPlugins()
      const { calls, instance } = createInstance()

      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      const plugin = await plugins.getPlugin('foo')
      assert.equal(plugin.configured, false)
      assert.equal(plugin.loaded, undefined)
      assert.deepEqual(calls, [])
    })

    it('configures with the saved configuration', async () => {
      const { plugins } = createPlugins({ foo: { autoload: true, configuration: { host: 'example.org' } } })
      const { calls, instance } = createInstance()

      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      assert.equal((await plugins.getPlugin('foo')).configured, true)
      assert.deepEqual(calls[0], ['configure', { host: 'example.org' }, { loaded: undefined }])
    })

    it('throws when the saved configuration is invalid', async () => {
      const { plugins } = createPlugins({ foo: { autoload: true, configuration: { host: 42 } } })
      const { instance } = createInstance()

      await assert.rejects(
        register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance }),
        isInvalidParameters
      )
    })

    it('does not load when autoload is disabled', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false } })
      const { calls, instance } = createInstance()

      await register(plugins, 'foo', { instance })

      const plugin = await plugins.getPlugin('foo')
      assert.equal(plugin.autoload, false)
      assert.equal(plugin.loaded, undefined)
      assert.deepEqual(calls, [])
    })
  })

  describe('getPlugin()', () => {
    it('exposes the plugin with an obfuscated configuration', async () => {
      const { plugins } = createPlugins({
        foo: { autoload: false, configuration: { host: 'example.org', password: 'secret' } },
      })
      const { instance } = createInstance({ testable: true })

      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance, testSchema: OPTIONAL_SCHEMA })

      assert.deepEqual(await plugins.getPlugin('foo'), {
        id: 'foo',
        name: 'foo',
        autoload: false,
        description: 'description',
        loaded: undefined,
        keywords: ['keyword'],
        unloadable: true,
        version: '1.0.0',
        configuration: { host: 'example.org', password: OBFUSCATED_VALUE },
        configurationPresets: undefined,
        configurationSchema: REQUIRED_SCHEMA,
        configured: true,
        testable: true,
        testSchema: OPTIONAL_SCHEMA,
      })
    })

    it('throws on an unknown plugin', async () => {
      const { plugins } = createPlugins()

      await assert.rejects(plugins.getPlugin('foo'), error => noSuchObject.is(error, { id: 'foo', type: 'plugin' }))
    })
  })

  describe('loadPlugin()', () => {
    it('refuses to load a plugin which is not configured', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false } })
      const { instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await assert.rejects(plugins.loadPlugin('foo'), isInvalidParameters)
    })

    it('refuses to load a plugin which is already loaded', async () => {
      const { plugins } = createPlugins()
      const { instance } = createInstance()
      await register(plugins, 'foo', { instance })

      await assert.rejects(plugins.loadPlugin('foo'), isInvalidParameters)
    })

    it('loads a configured plugin', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false } })
      const { calls, instance } = createInstance()
      await register(plugins, 'foo', { instance })

      await plugins.loadPlugin('foo')

      assert.equal((await plugins.getPlugin('foo')).loaded, true)
      assert.deepEqual(calls, [['load']])
    })
  })

  describe('unloadPlugin()', () => {
    it('refuses to unload a plugin which cannot be unloaded', async () => {
      const { plugins } = createPlugins()
      const { instance } = createInstance({ unloadable: false })
      await register(plugins, 'foo', { instance })

      await assert.rejects(plugins.unloadPlugin('foo'), isInvalidParameters)
    })
  })

  describe('configurePlugin()', () => {
    it('validates, applies and saves the configuration', async () => {
      const { plugins, stored } = createPlugins({ foo: { autoload: false } })
      const { calls, instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await plugins.configurePlugin('foo', { host: 'example.org' })

      assert.equal((await plugins.getPlugin('foo')).configured, true)
      assert.deepEqual(stored.foo.configuration, { host: 'example.org' })
      assert.deepEqual(calls.at(-1), ['configure', { host: 'example.org' }, { loaded: undefined }])
    })

    it('neither applies nor saves an invalid configuration', async () => {
      const { plugins, stored } = createPlugins({ foo: { autoload: false } })
      const { calls, instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await assert.rejects(plugins.configurePlugin('foo', {}), isInvalidParameters)

      assert.equal(stored.foo.configuration, undefined)
      assert.deepEqual(calls, [])
    })

    it('keeps the saved values of the obfuscated ones', async () => {
      const { plugins, stored } = createPlugins({
        foo: { autoload: false, configuration: { host: 'example.org', password: 'secret' } },
      })
      const { instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await plugins.configurePlugin('foo', { host: 'example.net', password: OBFUSCATED_VALUE })

      assert.deepEqual(stored.foo.configuration, { host: 'example.net', password: 'secret' })
    })

    it('merges with the saved configuration when asked', async () => {
      const { plugins, stored } = createPlugins({
        foo: { autoload: false, configuration: { host: 'example.org', password: 'secret' } },
      })
      const { instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await plugins.configurePlugin('foo', { host: 'example.net' }, true)

      assert.deepEqual(stored.foo.configuration, { host: 'example.net', password: 'secret' })
    })

    it('refuses to configure a non configurable plugin', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false } })
      const { instance } = createInstance()
      await register(plugins, 'foo', { instance })

      await assert.rejects(plugins.configurePlugin('foo', {}), isInvalidParameters)
    })
  })

  describe('purgePluginConfiguration()', () => {
    it('unloads the plugin, removes its configuration and makes it not configured', async () => {
      const { plugins, stored } = createPlugins({ foo: { autoload: true, configuration: { host: 'example.org' } } })
      const { calls, instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: REQUIRED_SCHEMA, instance })

      await plugins.purgePluginConfiguration('foo')

      const plugin = await plugins.getPlugin('foo')
      assert.equal(plugin.configured, false)
      assert.equal(plugin.loaded, false)
      assert.equal(stored.foo.configuration, undefined)
      assert.deepEqual(calls.at(-1), ['unload'])
      await assert.rejects(plugins.loadPlugin('foo'), isInvalidParameters)
    })

    it('keeps the plugin configured when an empty configuration is valid', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false, configuration: { host: 'example.org' } } })
      const { calls, instance } = createInstance()
      await register(plugins, 'foo', { configurationSchema: OPTIONAL_SCHEMA, instance })

      await plugins.purgePluginConfiguration('foo')

      assert.equal((await plugins.getPlugin('foo')).configured, true)
      // the instance no longer uses the deleted configuration
      assert.deepEqual(calls.at(-1), ['configure', {}, { loaded: undefined }])
    })

    it('keeps a non configurable plugin configured', async () => {
      const { plugins } = createPlugins()
      const { instance } = createInstance()
      await register(plugins, 'foo', { instance })

      await plugins.purgePluginConfiguration('foo')

      assert.equal((await plugins.getPlugin('foo')).configured, true)
    })

    it('throws on an unknown plugin', async () => {
      const { plugins } = createPlugins()

      await assert.rejects(plugins.purgePluginConfiguration('foo'), error =>
        noSuchObject.is(error, { id: 'foo', type: 'plugin' })
      )
    })
  })

  describe('testPlugin()', () => {
    it('refuses to test a plugin which is not testable', async () => {
      const { plugins } = createPlugins()
      const { instance } = createInstance()
      await register(plugins, 'foo', { instance })

      await assert.rejects(plugins.testPlugin('foo', {}), isInvalidParameters)
    })

    it('refuses to test a plugin which is not loaded', async () => {
      const { plugins } = createPlugins({ foo: { autoload: false } })
      const { instance } = createInstance({ testable: true })
      await register(plugins, 'foo', { instance })

      await assert.rejects(plugins.testPlugin('foo', {}), isInvalidParameters)
    })

    it('refuses data which do not match the test schema', async () => {
      const { plugins } = createPlugins()
      const { instance } = createInstance({ testable: true })
      await register(plugins, 'foo', { instance, testSchema: REQUIRED_SCHEMA })

      await assert.rejects(plugins.testPlugin('foo', undefined), isInvalidParameters)
      await assert.rejects(plugins.testPlugin('foo', {}), isInvalidParameters)
    })

    it('tests the plugin with the data', async () => {
      const { plugins } = createPlugins()
      const { calls, instance } = createInstance({ testable: true })
      await register(plugins, 'foo', { instance, testSchema: REQUIRED_SCHEMA })

      await plugins.testPlugin('foo', { host: 'example.org' })

      assert.deepEqual(calls.at(-1), ['test', { host: 'example.org' }])
    })
  })

  describe('plugin collection', () => {
    it('registers the plugins as a collection when the core is started', async () => {
      const { app, plugins } = createPlugins()
      const registered = []
      app.hooks.on('registerCollection', options => registered.push(options))
      app.addConfigManager = () => {}
      // just enough of Redis to create the plugins metadata, which are replaced by the ones of the test
      app._redis = { sAdd: async () => {}, get: async () => '20170905' }

      // `_pluginsMetadata` is replaced by the one of the test, the collection must be registered anyway
      const pluginsMetadata = plugins._pluginsMetadata
      app.hooks.emit('core started')
      plugins._pluginsMetadata = pluginsMetadata
      await register(plugins, 'foo', { instance: createInstance().instance })

      assert.equal(registered.length, 1)
      const { collection, type } = registered[0]
      assert.equal(type, 'plugin')
      assert.deepEqual(
        (await collection.get()).map(plugin => plugin.id),
        ['foo']
      )
      assert.equal((await collection.first('foo')).id, 'foo')
      assert.equal(await collection.first('unknown'), undefined)
    })

    it('signals a registered plugin, even when it could not be configured', async () => {
      const { plugins, touched } = createPlugins()

      await register(plugins, 'foo', { instance: createInstance().instance, configurationSchema: REQUIRED_SCHEMA })

      assert.deepEqual(touched, ['foo'])
    })

    it('signals each change of the plugin state', async () => {
      const { plugins, touched } = createPlugins({ foo: { autoload: false } })
      await register(plugins, 'foo', { instance: createInstance().instance, configurationSchema: REQUIRED_SCHEMA })
      touched.length = 0

      await plugins.configurePlugin('foo', { host: 'example.org' })
      assert.deepEqual(touched, ['foo'], 'configure')

      touched.length = 0
      await plugins.loadPlugin('foo')
      assert.deepEqual(touched, ['foo'], 'load')

      touched.length = 0
      await plugins.unloadPlugin('foo')
      assert.deepEqual(touched, ['foo'], 'unload')

      touched.length = 0
      await plugins.enablePluginAutoload('foo')
      await plugins.disablePluginAutoload('foo')
      assert.deepEqual(touched, ['foo', 'foo'], 'autoload')

      touched.length = 0
      await plugins.purgePluginConfiguration('foo')
      assert.deepEqual(touched, ['foo'], 'purge')
    })

    it('does not signal a failed change', async () => {
      const { plugins, touched } = createPlugins({ foo: { autoload: false } })
      await register(plugins, 'foo', { instance: createInstance().instance, configurationSchema: REQUIRED_SCHEMA })
      touched.length = 0

      await assert.rejects(plugins.configurePlugin('foo', {}), isInvalidParameters)
      await assert.rejects(plugins.loadPlugin('foo'), isInvalidParameters)

      assert.deepEqual(touched, [])
    })
  })
})
