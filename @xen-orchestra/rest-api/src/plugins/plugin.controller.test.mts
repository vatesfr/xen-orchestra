import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Request as ExRequest } from 'express'
import type { XoPlugin } from '@vates/types'
import { incorrectState, noSuchObject } from 'xo-common/api-errors.js'

import { PluginController } from './plugin.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const plugins = [
  { id: 'auth-ldap', name: 'auth-ldap', configured: true, loaded: true, testable: true, unloadable: true },
  { id: 'transport-email', name: 'transport-email', configured: true, loaded: false, testable: true, unloadable: true },
] as XoPlugin[]

function createController() {
  const calls: unknown[] = []
  const tasks: unknown[] = []
  const record =
    (method: string) =>
    async (...args: unknown[]) => {
      calls.push([method, ...args])
    }
  const restApi = {
    getCurrentUser: () => ({ id: 'user-1', permission: 'admin' }),
    tasks: {
      create: (properties: unknown) => {
        tasks.push(properties)
        return { id: 'task-1', properties, run: (fn: () => unknown) => fn() }
      },
    },
    xoApp: {
      getPlugins: async () => plugins,
      getPlugin: async (id: string) => {
        const plugin = plugins.find(plugin => plugin.id === id)
        if (plugin === undefined) {
          throw noSuchObject(id, 'plugin')
        }
        return plugin
      },
      configurePlugin: record('configurePlugin'),
      disablePluginAutoload: record('disablePluginAutoload'),
      enablePluginAutoload: record('enablePluginAutoload'),
      loadPlugin: record('loadPlugin'),
      purgePluginConfiguration: record('purgePluginConfiguration'),
      testPlugin: record('testPlugin'),
      unloadPlugin: record('unloadPlugin'),
    },
  } as unknown as RestApi
  const controller = new PluginController(restApi)
  return { calls, controller, tasks }
}

const isNoSuchPlugin = (error: unknown) => noSuchObject.is(error, { id: 'unknown', type: 'plugin' })

describe('PluginController.getPlugins', () => {
  it('returns the URLs of the plugins matching the filter', async () => {
    const { controller } = createController()
    const req = { path: '/rest/v0/plugins', query: {} } as unknown as ExRequest

    assert.deepEqual(await controller.getPlugins(req), [
      '/rest/v0/plugins/auth-ldap',
      '/rest/v0/plugins/transport-email',
    ])
    assert.deepEqual(await controller.getPlugins(req, undefined, undefined, undefined, 'loaded?'), [
      '/rest/v0/plugins/auth-ldap',
    ])
  })
})

describe('PluginController.getPlugin', () => {
  it('returns the plugin', async () => {
    const { controller } = createController()

    assert.equal(await controller.getPlugin('auth-ldap'), plugins[0])
  })

  it('throws noSuchObject for an unknown plugin', async () => {
    const { controller } = createController()

    await assert.rejects(controller.getPlugin('unknown'), isNoSuchPlugin)
  })
})

describe('PluginController.updatePlugin', () => {
  it('enables or disables the autoload', async () => {
    const { calls, controller } = createController()

    await controller.updatePlugin('auth-ldap', { autoload: true })
    await controller.updatePlugin('auth-ldap', { autoload: false })

    assert.deepEqual(calls, [
      ['enablePluginAutoload', 'auth-ldap'],
      ['disablePluginAutoload', 'auth-ldap'],
    ])
  })

  it('does nothing without autoload', async () => {
    const { calls, controller } = createController()

    await controller.updatePlugin('auth-ldap', {})

    assert.deepEqual(calls, [])
  })
})

describe('PluginController.configurePlugin', () => {
  it('forwards the configuration', async () => {
    const { calls, controller } = createController()
    const configuration = { base: 'dc=example,dc=org', uri: 'ldap://example.org', userIdAttribute: 'uid' }

    await controller.configurePlugin('auth-ldap', configuration)

    assert.deepEqual(calls, [['configurePlugin', 'auth-ldap', configuration]])
  })
})

describe('PluginController.deletePluginConfiguration', () => {
  it('purges the configuration', async () => {
    const { calls, controller } = createController()

    await controller.deletePluginConfiguration('transport-email')

    assert.deepEqual(calls, [['purgePluginConfiguration', 'transport-email']])
  })

  it('throws incorrectState for a loaded plugin, without purging', async () => {
    const { calls, controller } = createController()

    await assert.rejects(controller.deletePluginConfiguration('auth-ldap'), error =>
      incorrectState.is(error, { actual: true, expected: false, object: 'auth-ldap', property: 'loaded' })
    )
    assert.deepEqual(calls, [])
  })

  it('throws noSuchObject for an unknown plugin, without purging', async () => {
    const { calls, controller } = createController()

    await assert.rejects(controller.deletePluginConfiguration('unknown'), isNoSuchPlugin)
    assert.deepEqual(calls, [])
  })
})

// loading requires an unloaded plugin, unloading a loaded one
for (const [method, xoAppMethod, pluginId, taskName] of [
  ['loadPlugin', 'loadPlugin', 'transport-email', 'load transport-email plugin'],
  ['unloadPlugin', 'unloadPlugin', 'auth-ldap', 'unload auth-ldap plugin'],
] as const) {
  describe(`PluginController.${method}`, () => {
    it(`calls ${xoAppMethod} in a task`, async () => {
      const { calls, controller, tasks } = createController()

      await controller[method](pluginId, true)

      assert.deepEqual(calls, [[xoAppMethod, pluginId]])
      assert.deepEqual(tasks, [
        {
          name: `REST API: ${taskName}`,
          objectId: pluginId,
          objectType: 'plugin',
          type: 'xo:rest-api:action',
        },
      ])
      assert.equal(controller.getStatus(), 204)
    })

    it('returns the task id when not synchronous', async () => {
      const { controller } = createController()

      assert.deepEqual(await controller[method](pluginId), { taskId: 'task-1' })
      assert.equal(controller.getStatus(), 202)
    })
  })
}

describe('PluginController.testPlugin', () => {
  it('forwards the data in a task', async () => {
    const { calls, controller, tasks } = createController()
    const body = { data: { to: 'admin@example.org' } }

    await controller.testPlugin('auth-ldap', body, true)

    assert.deepEqual(calls, [['testPlugin', 'auth-ldap', body.data]])
    assert.deepEqual(tasks, [
      {
        name: 'REST API: test auth-ldap plugin',
        objectId: 'auth-ldap',
        objectType: 'plugin',
        params: body.data,
        type: 'xo:rest-api:action',
      },
    ])
    assert.equal(controller.getStatus(), 204)
  })

  it('forwards undefined data when the body has none', async () => {
    const { calls, controller } = createController()

    await controller.testPlugin('auth-ldap', {}, true)

    assert.deepEqual(calls, [['testPlugin', 'auth-ldap', undefined]])
  })
})
