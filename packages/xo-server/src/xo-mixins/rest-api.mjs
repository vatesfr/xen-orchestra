import setupRestApi from '@xen-orchestra/rest-api'
import { asyncEach } from '@vates/async-each'
import { createGzip } from 'node:zlib'
import { defer } from 'golike-defer'
import { every } from '@vates/predicates'
import { ifDef } from '@xen-orchestra/defined'
import { featureUnauthorized, invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { json, Router } from 'express'
import { Readable } from 'node:stream'
import cloneDeep from 'lodash/cloneDeep.js'
import path from 'node:path'
import pick from 'lodash/pick.js'
import * as CM from 'complex-matcher'

import { getUserPublicProperties, isAlarm } from '../utils.mjs'
import { compileXoJsonSchema } from './_xoJsonSchema.mjs'

const { join } = path.posix
const noop = Function.prototype

function compressMaybe(req, res) {
  let transform

  const acceptEncoding = req.headers['accept-encoding']
  if (
    acceptEncoding !== undefined &&
    acceptEncoding.split(',').some(_ => _.split(';')[0].trim().toLocaleLowerCase() === 'gzip')
  ) {
    res.setHeader('content-encoding', 'gzip')
    transform = createGzip()
  }

  if (transform !== undefined) {
    pipeline(transform, res).catch(noop)
    return transform
  }
  return res
}

async function* mapIterable(iterable, mapper) {
  for await (const item of iterable) {
    yield mapper(item)
  }
}

async function* makeJsonStream(iterable) {
  yield '['
  let first = true
  for await (const object of iterable) {
    if (first) {
      first = false
      yield '\n'
    } else {
      yield ',\n'
    }
    yield JSON.stringify(object, null, 2)
  }
  yield '\n]\n'
}

async function* makeNdJsonStream(iterable) {
  for await (const object of iterable) {
    yield JSON.stringify(object)
    yield '\n'
  }
}

function makeObjectMapper(req, path = req.path) {
  const { query } = req

  const { baseUrl } = req
  const makeUrl =
    typeof path === 'function'
      ? object => join(baseUrl, path(object), typeof object.id === 'number' ? String(object.id) : object.id)
      : ({ id }) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)

  let objectMapper
  let { fields } = query
  if (fields === undefined) {
    objectMapper = makeUrl
  } else if (fields === '*') {
    objectMapper = object => ({
      ...object,
      href: makeUrl(object),
    })
  } else {
    fields = fields.split(',')
    objectMapper = object => {
      const url = makeUrl(object)
      object = pick(object, fields)
      object.href = url
      return object
    }
  }

  return function (entry) {
    return objectMapper(typeof entry === 'string' ? { id: entry } : entry)
  }
}

async function sendObjects(iterable, req, res, mapper) {
  const json = !Object.hasOwn(req.query, 'ndjson')

  if (mapper !== null) {
    if (typeof mapper !== 'function') {
      mapper = makeObjectMapper(req, ...Array.prototype.slice.call(arguments, 3))
    }
    iterable = mapIterable(iterable, mapper)
  }

  res.setHeader('content-type', json ? 'application/json' : 'application/x-ndjson')
  return pipeline((json ? makeJsonStream : makeNdJsonStream)(iterable), res)
}

function handleArray(array, filter, limit) {
  if (filter !== undefined) {
    array = array.filter(filter)
  }
  if (limit < array.length) {
    array.length = limit
  }

  return array
}

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()

const subRouter = (app, path) => {
  const router = Router({ strict: false })
  app.use(path, router)
  return router
}

// wraps an async middleware
function wrap(middleware, handleNoSuchObject = false) {
  return async function asyncMiddlewareWrapped(req, res, next) {
    try {
      await middleware.apply(this, arguments)
    } catch (error) {
      if (featureUnauthorized.is(error)) {
        res.sendStatus(403)
      } else if (handleNoSuchObject && noSuchObject.is(error)) {
        res.sendStatus(404)
      } else {
        next(error)
      }
    }
  }
}

const keepNonAlarmMessages = message => message.type === 'message' && !isAlarm(message)
export default class RestApi {
  #api

  constructor(app, { express }) {
    // don't set up the API if express is not present
    //
    // that can happen when the app is instantiated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const api = subRouter(express, '/rest/v0')
    this.#api = api

    // register the route BEFORE the authentication middleware because this route does not require authentication
    api.post('/users/authentication_tokens', json(), async (req, res) => {
      const authorization = req.headers.authorization ?? ''
      const [, encodedCredentials] = authorization.split(' ')
      if (encodedCredentials === undefined) {
        return res.status(401).json('missing credentials')
      }

      const [username, password] = Buffer.from(encodedCredentials, 'base64').toString().split(':')

      try {
        const { user } = await app.authenticateUser({ username, password, otp: req.query.otp })
        const token = await app.createAuthenticationToken({
          client: req.body.client,
          userId: user.id,
          description: req.body.description,
          expiresIn: req.body.expiresIn,
        })
        res.json({ token })
      } catch (error) {
        if (invalidCredentials.is(error)) {
          res.status(401)
        } else {
          res.status(400)
        }
        res.json(error.message)
      }
    })

    api.use((req, res, next) => {
      const { cookies, ip } = req
      const token = cookies.authenticationToken ?? cookies.token
      if (token === undefined) {
        res.sendStatus(401)
        return
      }

      app.authenticateUser({ token }, { ip }).then(
        ({ user }) => {
          if (user.permission === 'admin') {
            return app.runWithApiContext(user, next)
          }

          res.sendStatus(401)
        },
        error => {
          if (invalidCredentials.is(error)) {
            res.sendStatus(401)
          } else {
            next(error)
          }
        }
      )
    })

    const collections = { __proto__: null }
    // add migrated collections to maintain their discoverability
    const swaggerEndpoints = {
      alarms: {},
      dashboard: {},
      docs: {},
      messages: {},
      networks: {
        routes: {
          alarms: true,
          messages: true,
        },
      },
      pifs: {
        routes: {
          alarms: true,
          messages: true,
        },
      },
      pools: {
        actions: {
          create_vm: true,
          emergency_shutdown: true,
          rolling_reboot: true,
          rolling_update: true,
        },
        routes: {
          alarms: true,
          missing_patches: true,
          messages: true,
        },
      },
      groups: {
        routes: {
          users: true,
        },
      },
      users: {
        routes: {
          groups: true,
          authentication_tokens: true,
        },
      },
      vifs: {
        routes: {
          alarms: true,
        },
      },
      vms: {
        actions: {
          start: true,
          clean_shutdown: true,
          hard_shutdown: true,
          clean_reboot: true,
          hard_reboot: true,
          snapshot: true,
        },
        routes: {
          alarms: true,
          vdis: true,
          messages: true,
          tasks: true,
        },
      },
      'vm-controllers': {
        routes: {
          alarms: true,
          vdis: true,
        },
      },
      'vm-snapshots': {
        routes: {
          alarms: true,
          vdis: true,
          messages: true,
        },
      },
      'vm-templates': {
        routes: {
          alarms: true,
          vdis: true,
          messages: true,
        },
      },
      hosts: {
        routes: {
          'audit.txt': true,
          'logs.tgz': true,
          alarms: true,
          smt: true,
          missing_patches: true,
          messages: true,
        },
      },
      srs: {
        routes: {
          alarms: true,
          messages: true,
        },
      },
      vbds: {
        routes: {
          alarms: true,
        },
      },
      vdis: {
        routes: {
          alarms: true,
          messages: true,
        },
      },
      'vdi-snapshots': {
        routes: {
          alarms: true,
          messages: true,
        },
      },
      servers: {},
      tasks: {},
    }

    const withParams = (fn, paramsSchema) => {
      fn.params = paramsSchema
      fn.validateParams = compileXoJsonSchema({ type: 'object', properties: cloneDeep(paramsSchema) })
      return fn
    }

    {
      const types = [
        'host',
        'message',
        'network',
        'PIF',
        'pool',
        'SR',
        'VBD',
        'VDI-snapshot',
        'VDI',
        'VIF',
        'VM-controller',
        'VM-snapshot',
        'VM-template',
        'VM',
      ]
      function getObject(id, req) {
        const { type } = this
        const object = app.getObject(id, type)

        // add also the XAPI version of the object
        req.xapiObject = app.getXapiObject(object)

        return object
      }
      function getObjects(filter, limit) {
        return Object.values(
          app.getObjects({
            filter: every(this.isCorrectType, filter),
            limit,
          })
        )
      }
      async function messages(req, res) {
        const {
          object: { id },
          query,
        } = req
        await sendObjects(
          Object.values(
            app.getObjects({
              filter: every(_ => _.$object === id, keepNonAlarmMessages, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            })
          ),
          req,
          res,
          '/messages'
        )
      }

      async function alarms(req, res) {
        const {
          object: { id },
          query,
        } = req
        await sendObjects(
          Object.values(
            app.getObjects({
              filter: every(_ => _.$object === id, isAlarm, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            })
          ),
          req,
          res,
          '/alarms'
        )
      }

      for (const type of types) {
        const id = type.toLocaleLowerCase() + 's'

        collections[id] = {
          getObject,
          getObjects,
          routes: { messages, alarms },
          isCorrectType: _ => _.type === type,
          type,
        }
      }

      collections.hosts.routes = {
        ...collections.hosts.routes,

        async 'audit.txt'(req, res) {
          const host = req.xapiObject

          const response = await host.$xapi.getResource('/audit_log', { host })

          res.setHeader('content-type', 'text/plain')
          await pipeline(response.body, compressMaybe(req, res))
        },

        async 'logs.tgz'(req, res) {
          const host = req.xapiObject

          const response = await host.$xapi.getResource('/host_logs_download', { host })

          res.setHeader('content-type', 'application/gzip')
          await pipeline(response.body, res)
        },

        async missing_patches(req, res) {
          await app.checkFeatureAuthorization('LIST_MISSING_PATCHES')

          const host = req.xapiObject
          res.json(await host.$xapi.listMissingPatches(host))
        },

        async smt({ xapiObject }, res) {
          res.json({ enabled: await xapiObject.$xapi.isHyperThreadingEnabled(xapiObject.$id) })
        },
      }

      collections.pools.routes = {
        ...collections.pools.routes,

        async missing_patches(req, res) {
          await app.checkFeatureAuthorization('LIST_MISSING_PATCHES')

          const xapi = req.xapiObject.$xapi
          const missingPatches = new Map()
          await asyncEach(Object.values(xapi.objects.indexes.type.host ?? {}), async host => {
            try {
              for (const patch of await xapi.listMissingPatches(host)) {
                const { uuid: key = `${patch.name}-${patch.version}-${patch.release}` } = patch
                missingPatches.set(key, patch)
              }
            } catch (error) {
              console.warn(host.uuid, error)
            }
          })
          res.json(Array.from(missingPatches.values()))
        },
      }

      {
        async function vdis(req, res) {
          const vdis = new Map()
          for (const vbdId of req.object.$VBDs) {
            try {
              const vbd = app.getObject(vbdId, 'VBD')
              const vdiId = vbd.VDI
              if (vdiId !== undefined) {
                const vdi = app.getObject(vdiId, ['VDI', 'VDI-snapshot'])
                vdis.set(vdiId, vdi)
              }
            } catch (error) {
              console.warn('REST API', req.url, { error })
            }
          }

          const { query } = req
          await sendObjects(
            handleArray(Array.from(vdis.values()), handleOptionalUserFilter(query.filter), ifDef(query.limit, Number)),
            req,
            res,
            makeObjectMapper(req, ({ type }) => type.toLowerCase() + 's')
          )
        }

        for (const collection of ['vms', 'vm-controllers', 'vm-snapshots', 'vm-templates']) {
          collections[collection].routes.vdis = vdis
        }
      }

      collections.pools.actions = {
        create_vm: withParams(
          defer(
            async (
              $defer,
              { xapiObject: { $xapi } },
              { affinity, boot, cloud_config, destroy_cloud_config_vdi, install, network_config, template, ...params },
              req
            ) => {
              params.affinityHost = affinity
              params.installRepository = install?.repository
              // Mac expect min length 1
              params.vifs = params.vifs.map(vif => ({ ...vif, mac: vif.mac?.trim() ?? '' }))
              const vm = await $xapi.createVm(template, params, undefined, app.apiContext.user.id)
              $defer.onFailure.call($xapi, 'VM_destroy', vm.$ref)

              let cloudConfigVdiUuid
              if (cloud_config !== undefined) {
                cloudConfigVdiUuid = await $xapi.VM_createCloudInitConfig(vm.$ref, cloud_config, {
                  networkConfig: network_config,
                })
              }

              let timeLimit
              if (boot) {
                timeLimit = Date.now() + 10 * 60 * 1000
                await $xapi.callAsync('VM.start', vm.$ref, false, false)
              }

              if (destroy_cloud_config_vdi && cloudConfigVdiUuid !== undefined && boot) {
                try {
                  await $xapi.VDI_destroyCloudInitConfig($xapi.getObject(cloudConfigVdiUuid).$ref, {
                    timeLimit,
                  })
                } catch (error) {
                  console.error('destroy cloud init config VDI failed', {
                    error,
                    vdi: { uuid: cloudConfigVdiUuid },
                    vm: { uuid: vm.uuid },
                  })
                }
              }

              return vm.uuid
            }
          ),
          {
            affinity: { type: 'string', optional: true },
            auto_poweron: { type: 'boolean', optional: true },
            boot: { type: 'boolean', default: false },
            clone: { type: 'boolean', default: true },
            cloud_config: { type: 'string', optional: true },
            destroy_cloud_config_vdi: { type: 'boolean', default: false },
            install: {
              type: 'object',
              optional: true,
              properties: {
                method: { enum: ['cdrom', 'network'] },
                repository: { type: 'string' },
              },
            },
            memory: { type: 'integer', optional: true },
            name_description: { type: 'string', minLength: 0, optional: true },
            name_label: { type: 'string' },
            network_config: { type: 'string', optional: true },
            template: { type: 'string' },
            vdis: {
              type: 'array',
              default: [],
              items: {
                type: 'object',
                properties: {
                  destroy: { type: 'boolean', optional: true },
                  userdevice: { type: 'string', optional: true },
                  size: { type: 'number', optional: true },
                  sr: { type: 'string', optional: true },
                  name_description: { type: 'string', optional: true },
                  name_label: { type: 'string', optional: true },
                },
                if: {
                  not: {
                    required: ['userdevice'],
                  },
                },
                then: {
                  required: ['size', 'name_label'],
                  not: {
                    required: ['destroy'],
                  },
                },
              },
            },
            vifs: {
              default: [],
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  destroy: { type: 'boolean', optional: true },
                  device: { type: 'string', optional: true },
                  ipv4_allowed: { type: 'array', items: { type: 'string' }, optional: true },
                  ipv6_allowed: { type: 'array', items: { type: 'string' }, optional: true },
                  mac: { type: 'string', optional: true },
                  network: { type: 'string', optional: true },
                },
              },
            },
          }
        ),
        emergency_shutdown: async ({ xapiObject }) => {
          await app.checkFeatureAuthorization('POOL_EMERGENCY_SHUTDOWN')

          await xapiObject.$xapi.pool_emergencyShutdown()
        },
        rolling_reboot: async ({ object }) => {
          await app.checkFeatureAuthorization('ROLLING_POOL_REBOOT')

          await app.rollingPoolReboot(object)
        },
        rolling_update: async ({ object }) => {
          await app.checkFeatureAuthorization('ROLLING_POOL_UPDATE')

          await app.rollingPoolUpdate(object)
        },
      }
      collections.vms.actions = {
        clean_reboot: ({ xapiObject: vm }) => vm.$callAsync('clean_reboot').then(noop),
        clean_shutdown: ({ xapiObject: vm }) => vm.$callAsync('clean_shutdown').then(noop),
        hard_reboot: ({ xapiObject: vm }) => vm.$callAsync('hard_reboot').then(noop),
        hard_shutdown: ({ xapiObject: vm }) => vm.$callAsync('hard_shutdown').then(noop),
        snapshot: withParams(
          async ({ xapiObject: vm }, { name_label }) => {
            const ref = await vm.$snapshot({ ignoredVdisTag: '[NOSNAP]', name_label })
            return vm.$xapi.getField('VM', ref, 'uuid')
          },
          { name_label: { type: 'string', optional: true } }
        ),
        start: ({ xapiObject: vm }) => vm.$callAsync('start', false, false).then(noop),
      }
    }

    collections.backup = {}
    collections.groups = {
      routes: {
        async users(req, res) {
          const { filter, limit } = req.query
          await sendObjects(
            handleArray(
              await Promise.all(req.object.users.map(id => app.getUser(id).then(getUserPublicProperties))),
              handleOptionalUserFilter(filter),
              ifDef(limit, Number)
            ),
            req,
            res,
            '/users'
          )
        },
      },
    }
    collections.restore = {}
    collections.tasks = {
      async getObject(id, req) {
        return app.tasks.get(id)
      },
      getObjects(filter, limit) {
        return app.tasks.list({ filter, limit })
      },
      watch(filter) {
        const stream = new Readable({ objectMode: true, read: noop })
        const onUpdate = object => {
          if (filter === undefined || filter(object)) {
            stream.push(['update', object])
          }
        }
        const onRemove = id => {
          stream.push(['remove', id])
        }
        app.tasks.on('update', onUpdate).on('remove', onRemove)
        stream.on('close', () => {
          app.tasks.off('update', onUpdate).off('remove', onRemove)
        })
        return stream[Symbol.asyncIterator]()
      },
    }
    collections.users = {
      routes: {
        async authentication_tokens(req, res) {
          const { filter, limit } = req.query

          const me = app.apiContext.user
          const user = req.object
          if (me.id !== user.id) {
            return res.status(403).json('You can only see your own authentication tokens')
          }

          const tokens = await app.getAuthenticationTokensForUser(me.id)

          res.json(handleArray(tokens, filter, limit))
        },
        async groups(req, res) {
          const { filter, limit } = req.query
          await sendObjects(
            handleArray(
              await Promise.all(req.object.groups.map(id => app.getGroup(id))),
              handleOptionalUserFilter(filter),
              ifDef(limit, Number)
            ),
            req,
            res,
            '/groups'
          )
        },
      },
    }

    // normalize collections
    for (const id of Object.keys(collections)) {
      const collection = collections[id]

      // inject id into the collection
      collection.id = id

      // set null as prototypes to speed-up look-ups
      Object.setPrototypeOf(collection, null)
      const { actions, routes } = collection
      if (actions !== undefined) {
        Object.setPrototypeOf(actions, null)
      }
      if (routes !== undefined) {
        Object.setPrototypeOf(routes, null)
      }
    }

    api.param('collection', (req, res, next) => {
      const id = req.params.collection
      const collection = collections[id]
      if (collection === undefined) {
        next('route')
      } else {
        req.collection = collection
        next()
      }
    })
    api.param('object', async (req, res, next) => {
      const { collection } = req
      if (collection === undefined || collection.getObject === undefined) {
        return next('route')
      }

      const id = req.params.object
      try {
        // eslint-disable-next-line require-atomic-updates
        req.object = await collection.getObject(id, req)
        return next()
      } catch (error) {
        if (noSuchObject.is(error, { id })) {
          next('route')
        } else {
          next(error)
        }
      }
    })

    api.get(
      '/',
      wrap((req, res) => {
        const endpoints = new Set([...Object.keys(collections), ...Object.keys(swaggerEndpoints)])
        return sendObjects(endpoints, req, res)
      })
    )

    const backupTypes = {
      __proto__: null,

      metadata: 'metadataBackup',
      mirror: 'mirrorBackup',
      vm: 'backup',
    }

    api
      .get(
        '/backup',
        wrap((req, res) => sendObjects([{ id: 'jobs' }, { id: 'logs' }], req, res))
      )

      .get(
        '/backup/jobs',
        wrap((req, res) =>
          sendObjects(
            Object.keys(backupTypes).map(id => ({ id })),
            req,
            res
          )
        )
      )

    api
      .get(
        '/restore',
        wrap((req, res) => sendObjects([{ id: 'logs' }], req, res))
      )
    api
      .get(
        '/tasks/:id/actions',
        wrap(async (req, res) => {
          const task = await app.tasks.get(req.params.id)

          await sendObjects(task.status === 'pending' ? [{ id: 'abort' }] : [], req, res)
        })
      )

    api.get(
      '/:collection',
      wrap(async (req, res, next) => {
        const { collection, query } = req
        if (swaggerEndpoints[collection.id] !== undefined) {
          return next('route')
        }

        const filter = handleOptionalUserFilter(query.filter)

        if (Object.hasOwn(query, 'ndjson') && Object.hasOwn(query, 'watch')) {
          const objectMapper = makeObjectMapper(req)
          const entryMapper = entry => [entry[0], objectMapper(entry[1])]

          try {
            await sendObjects(collection.watch(filter), req, res, entryMapper)
          } catch (error) {
            // ignore premature close in watch mode
            if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
              throw error
            }
          }
          return
        }

        await sendObjects(await collection.getObjects(filter, ifDef(query.limit, Number)), req, res)
      })
    )

    api.put(
      '/:collection(vdis|vdi-snapshots)/:object.:format(vhd|raw)',
      wrap(async (req, res) => {
        req.length = +req.headers['content-length']
        await req.xapiObject.$importContent(req, { format: req.params.format })

        res.sendStatus(204)
      })
    )

    api.get('/:collection/:object', (req, res, next) => {
      const { collection } = req
      if (swaggerEndpoints[collection.id] !== undefined) {
        return next('route')
      }
      let result = req.object

      // add locations of sub-routes for discoverability
      const { routes } = collection
      if (routes !== undefined) {
        result = { ...result }
        for (const route of Object.keys(routes)) {
          result[route.split('.')[0] + '_href'] = join(req.baseUrl, req.path, route)
        }
      }

      res.json(result)
    })

    api
      .patch(
        '/:collection/:object',
        json(),
        wrap(async (req, res) => {
          const obj = req.xapiObject

          const promises = []
          const { body } = req

          for (const key of ['name_description', 'name_label', 'tags']) {
            const value = body[key]
            if (value !== undefined) {
              promises.push(obj['set_' + key](value))
            }
          }

          await promises
          res.sendStatus(204)
        })
      )
      .delete(
        '/:collection/:object/tags/:tag',
        wrap(async (req, res) => {
          await req.xapiObject.$call('remove_tags', req.params.tag)

          res.sendStatus(204)
        })
      )
      .put(
        '/:collection/:object/tags/:tag',
        wrap(async (req, res) => {
          await req.xapiObject.$call('add_tags', req.params.tag)

          res.sendStatus(204)
        })
      )

    api.get('/:collection/:object/tasks', (req, res, next) => {
      const collection = req.params.collection
      if (swaggerEndpoints[collection].routes.tasks) {
        return next('route')
      }
      wrap(async (req, res) => {
        const { query } = req
        const objectId = req.object.id
        const tasks = app.tasks.list({
          filter: every(
            _ => _.status === 'pending' && _.properties.objectId === objectId,
            handleOptionalUserFilter(query.filter)
          ),
          limit: ifDef(query.limit, Number),
        })
        await sendObjects(tasks, req, res, '/tasks')
      })(req, res, next)
    })

    api.get(
      ['/:collection/_/actions', '/:collection/:object/actions'],
      wrap((req, res) => {
        const { actions } = req.collection
        return sendObjects(
          actions === undefined ? [] : Array.from(Object.keys(actions), id => ({ ...actions[id], id })),
          req,
          res
        )
      })
    )
    api.get(['/:collection/_/actions/:action', '/:collection/:object/actions/:action'], (req, res, next) => {
      const { action: id } = req.params
      const action = req.collection.actions?.[id]
      if (action === undefined) {
        return next()
      }

      res.json({ ...action })
    })
    api.post('/:collection/:object/actions/:action', json(), (req, res, next) => {
      const { collection } = req
      const { action } = req.params
      const fn = req.collection.actions?.[action]
      if (fn === undefined || swaggerEndpoints[collection.id]?.actions?.[action]) {
        return next()
      }

      const params = req.body

      const { validateParams } = fn
      if (validateParams !== undefined) {
        if (!validateParams(params)) {
          res.statusCode = 400
          return res.json(validateParams.errors)
        }
      }

      const { object, xapiObject } = req
      const task = app.tasks.create({ name: `REST: ${action} ${req.collection.type}`, objectId: object.id })
      const pResult = task.run(() => fn({ object, xapiObject }, params, req))
      if (Object.hasOwn(req.query, 'sync')) {
        pResult.then(result => res.json(result), next)
      } else {
        pResult.catch(noop)
        res.statusCode = 202
        res.end(req.baseUrl + '/tasks/' + task.id)
      }
    })

    api.get(
      '/:collection/:object/:route',
      wrap((req, res, next) => {
        const { collection } = req
        const { route } = req.params
        const handler = collection.routes?.[route]
        if (handler === undefined || swaggerEndpoints[collection.id]?.routes?.[route]) {
          return next()
        }
        return handler(req, res, next)
      })
    )

    setupRestApi(express, app)
  }

  registerRestApi(spec, base = '/') {
    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const handler = spec[path]
        this.#api[path.slice(1)](base, json(), async function autoRegisteredHandler(req, res, next) {
          try {
            const result = await handler(req, res, next)
            if (result !== undefined) {
              const isIterable =
                result !== null && typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
              if (isIterable) {
                await sendObjects(result, req, res)
              } else {
                res.json(result)
              }
            }
          } catch (error) {
            next(error)
          }
        })
      } else {
        this.registerRestApi(spec[path], join(base, path))
      }
    }
    return () => {
      this.unregisterRestApi(spec, base)
    }
  }

  unregisterRestApi(spec, base = '/') {
    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const method = path.slice(1)
        let found = false
        // looping through the API routes backwards, as the auto-registered routes were probably added last
        for (let i = this.#api.stack.length - 1; i >= 0; i--) {
          const route = this.#api.stack[i].route
          // route.stack[0] is the json parser
          // checking the handler name for an extra safety we're not removing a hardcoded route
          if (
            route.path === base &&
            route.stack[1]?.method === method &&
            route.stack[1]?.handle?.name === 'autoRegisteredHandler'
          ) {
            this.#api.stack.splice(i, 1)
            found = true
            break
          }
        }
        if (!found) {
          console.warn('Route to unregister not found', base)
        }
      } else {
        this.unregisterRestApi(spec[path], join(base, path))
      }
    }
  }
}
