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
import pDefer from 'promise-toolbox/defer'
import pick from 'lodash/pick.js'
import semver from 'semver'
import throttle from 'lodash/throttle.js'
import * as CM from 'complex-matcher'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from '@xen-orchestra/xapi'

import { getUserPublicProperties, isSrWritable } from '../utils.mjs'
import { compileXoJsonSchema } from './_xoJsonSchema.mjs'

// E.g: 'value: 0.6\nconfig:\n<variable>\n<name value="cpu_usage"/>\n<alarm_trigger_level value="0.4"/>\n<alarm_trigger_period value ="60"/>\n</variable>';
const ALARM_BODY_REGEX = /^value:\s*(\d+(?:\.\d+)?)\s*config:\s*<variable>\s*<name value="(.*?)"/

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

async function _getDashboardStats(app) {
  const dashboard = {}

  let hvSupportedVersions
  let nHostsEol
  if (typeof app.getHVSupportedVersions === 'function') {
    try {
      hvSupportedVersions = await app.getHVSupportedVersions()
      nHostsEol = 0
    } catch (error) {
      console.error(error)
    }
  }

  const poolIds = new Set()
  const hosts = []
  const writableSrs = []
  const alarms = []

  for (const obj of app.objects.values()) {
    if (obj.type === 'host') {
      hosts.push(obj)
      poolIds.add(obj.$pool)
      if (hvSupportedVersions !== undefined && !semver.satisfies(obj.version, hvSupportedVersions[obj.productBrand])) {
        nHostsEol++
      }
    }

    if (obj.type === 'SR') {
      if (isSrWritable(obj)) {
        writableSrs.push(obj)
      }
    }

    if (obj.type === 'message' && obj.name === 'ALARM') {
      alarms.push(obj)
    }
  }

  dashboard.nPools = poolIds.size
  dashboard.nHosts = hosts.length
  dashboard.nHostsEol = nHostsEol

  if (await app.hasFeatureAuthorization('LIST_MISSING_PATCHES')) {
    const poolsWithMissingPatches = new Set()
    let nHostsWithMissingPatches = 0

    await asyncEach(hosts, async host => {
      const xapi = app.getXapi(host)
      try {
        const patches = await xapi.listMissingPatches(host)
        if (patches.length > 0) {
          nHostsWithMissingPatches++
          poolsWithMissingPatches.add(host.$pool)
        }
      } catch (error) {
        console.error(error)
      }
    })

    const missingPatches = {
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }

    dashboard.missingPatches = missingPatches
  }

  try {
    const backupRepositoriesSize = Object.values(await app.getAllRemotesInfo()).reduce(
      (prev, remoteInfo) => ({
        available: prev.available + remoteInfo.available,
        backups: 0, // @TODO: compute the space used by backups
        other: 0, // @TODO: compute the space used by everything that is not a backup
        total: prev.total + remoteInfo.size,
        used: prev.used + remoteInfo.used,
      }),
      {
        available: 0,
        backups: 0,
        other: 0,
        total: 0,
        used: 0,
      }
    )
    dashboard.backupRepositories = { size: backupRepositoriesSize }
  } catch (error) {
    console.error(error)
  }

  const storageRepositoriesSize = writableSrs.reduce(
    (prev, sr) => ({
      total: prev.total + sr.size,
      used: prev.used + sr.physical_usage,
    }),
    {
      total: 0,
      used: 0,
    }
  )
  storageRepositoriesSize.available = storageRepositoriesSize.total - storageRepositoriesSize.used
  storageRepositoriesSize.other = 0 // @TODO: compute the space used by everything that is not a replicated VM
  storageRepositoriesSize.replicated = 0 // @TODO: compute the space used by replicated VMs

  dashboard.storageRepositories = { size: storageRepositoriesSize }

  dashboard.alarms = alarms.reduce((acc, { $object, body, time }) => {
    try {
      const [, value, name] = body.match(ALARM_BODY_REGEX)

      let object
      try {
        object = app.getObject($object)
      } catch (error) {
        console.error(error)
        object = {
          type: 'unknown',
          uuid: $object,
        }
      }

      acc.push({
        name,
        object: {
          type: object.type,
          uuid: object.uuid,
        },
        timestamp: time,
        value: +value,
      })
    } catch (error) {
      console.error(error)
    }

    return acc
  }, [])
  return dashboard
}
const getDashboardStats = throttle(_getDashboardStats, 6e4, { trailing: false, leading: true })

export default class RestApi {
  #api

  constructor(app, { express }) {
    // don't setup the API if express is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const api = subRouter(express, '/rest/v0')
    this.#api = api

    api.use((req, res, next) => {
      const { cookies, ip } = req
      app.authenticateUser({ token: cookies.authenticationToken ?? cookies.token }, { ip }).then(
        ({ user }) => {
          if (user.permission === 'admin') {
            req.user = user
            return next()
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
        'pool',
        'SR',
        'VBD',
        'VDI-snapshot',
        'VDI',
        'VIF',
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
              filter: every(_ => _.type === 'message' && _.$object === id, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            })
          ),
          req,
          res,
          '/messages'
        )
      }
      for (const type of types) {
        const id = type.toLocaleLowerCase() + 's'

        collections[id] = { getObject, getObjects, routes: { messages }, isCorrectType: _ => _.type === type, type }
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

        for (const collection of ['vms', 'vm-snapshots', 'vm-templates']) {
          collections[collection].routes.vdis = vdis
        }
      }

      collections.pools.actions = {
        create_vm: withParams(
          defer(async ($defer, { xapiObject: { $xapi } }, { affinity, boot, install, template, ...params }, req) => {
            params.affinityHost = affinity
            params.installRepository = install?.repository

            const vm = await $xapi.createVm(template, params, undefined, req.user.id)
            $defer.onFailure.call($xapi, 'VM_destroy', vm.$ref)

            if (boot) {
              await $xapi.callAsync('VM.start', vm.$ref, false, false)
            }

            return vm.uuid
          }),
          {
            affinity: { type: 'string', optional: true },
            auto_poweron: { type: 'boolean', optional: true },
            boot: { type: 'boolean', default: false },
            clone: { type: 'boolean', default: true },
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
            template: { type: 'string' },
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
      getObject(id) {
        return app.getGroup(id)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllGroups(), filter, limit)
      },
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
        const { wait } = req.query
        if (wait !== undefined) {
          const { promise, resolve } = pDefer()
          const stopWatch = await app.tasks.watch(id, task => {
            if (wait !== 'result' || task.status !== 'pending') {
              stopWatch()
              resolve(task)
            }
          })
          req.on('close', stopWatch)
          return promise
        } else {
          return app.tasks.get(id)
        }
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
    collections.servers = {
      getObject(id) {
        return app.getXenServer(id)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllXenServers(), filter, limit)
      },
    }
    collections.users = {
      getObject(id) {
        return app.getUser(id).then(getUserPublicProperties)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllUsers(), filter, limit)
      },
      routes: {
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
    collections.dashboard = {}

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
      wrap((req, res) => sendObjects(Object.values(collections), req, res))
    )

    // For compatibility redirect from /backups* to /backup
    api.get('/backups*', (req, res) => {
      res.redirect(308, req.baseUrl + '/backup' + req.params[0])
    })

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
        '/backup/logs',
        wrap(async (req, res) => {
          const { filter, limit } = req.query
          const logs = await app.getBackupNgLogsSorted({
            filter: every(({ message: m }) => m === 'backup' || m === 'metadata', handleOptionalUserFilter(filter)),
            limit: ifDef(limit, Number),
          })
          await sendObjects(logs, req, res)
        })
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

    for (const [collection, type] of Object.entries(backupTypes)) {
      api
        .get(
          '/backup/jobs/' + collection,
          wrap(async (req, res) => sendObjects(await app.getAllJobs(type), req, res))
        )
        .get(
          `/backup/jobs/${collection}/:id`,
          wrap(async (req, res) => {
            res.json(await app.getJob(req.params.id, type))
          }, true)
        )
    }

    // For compatibility, redirect /backup/jobs/:id to /backup/jobs/vm/:id
    api.get('/backup/jobs/:id', (req, res) => {
      res.redirect(308, req.baseUrl + '/backup/jobs/vm/' + req.params.id)
    })

    api.get(
      '/dashboard',
      wrap(async (req, res) => {
        res.json(await getDashboardStats(app))
      })
    )

    api
      .get(
        '/restore',
        wrap((req, res) => sendObjects([{ id: 'logs' }], req, res))
      )
      .get(
        '/restore/logs',
        wrap(async (req, res) => {
          const { filter, limit } = req.query
          const logs = await app.getBackupNgLogsSorted({
            filter: every(_ => _.message === 'restore', handleOptionalUserFilter(filter)),
            limit: ifDef(limit, Number),
          })
          await sendObjects(logs, req, res)
        })
      )
      .get(
        ['/backup/logs/:id', '/restore/logs/:id'],
        wrap(async (req, res) => {
          res.json(await app.getBackupNgLogs(req.params.id))
        })
      )

    api
      .delete(
        '/tasks',
        wrap(async (req, res) => {
          await app.tasks.clearLogs()
          res.sendStatus(200)
        })
      )
      .delete(
        '/tasks/:id',
        wrap(async (req, res) => {
          await app.tasks.deleteLog(req.params.id)
          res.sendStatus(200)
        })
      )
      .get(
        '/tasks/:id/actions',
        wrap(async (req, res) => {
          const task = await app.tasks.get(req.params.id)

          await sendObjects(task.status === 'pending' ? [{ id: 'abort' }] : [], req, res)
        })
      )
      .post(
        '/tasks/:id/actions/abort',
        wrap(async (req, res) => {
          const { id } = req.params
          await app.tasks.abort(id)
          res.status = 202
          res.end(req.baseUrl + '/tasks/' + id)
        }, true)
      )

    api.get(
      '/:collection',
      wrap(async (req, res) => {
        const { collection, query } = req

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

    // should go before routes /:collection/:object because they will match but
    // will not work due to the extension being included in the object identifer
    api.get(
      '/:collection(vdis|vdi-snapshots)/:object.:format(vhd|raw)',
      wrap(async (req, res) => {
        const preferNbd = Object.hasOwn(req.query, 'preferNbd')
        const nbdConcurrency = req.query.nbdConcurrency && parseInt(req.query.nbdConcurrency)
        const stream = await req.xapiObject.$exportContent({ format: req.params.format, preferNbd, nbdConcurrency })

        res.writeHead(200, 'OK', { 'content-disposition': 'attachment', 'content-length': stream.length })
        await pipeline(stream, res)
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
    api.get(
      '/:collection(vms|vm-snapshots|vm-templates)/:object.:format(ova|xva)',
      wrap(async (req, res) => {
        const vm = req.xapiObject

        const stream =
          req.params.format === 'ova'
            ? await vm.$xapi.exportVmOva(vm.$ref)
            : (
                await vm.$export({
                  compress: req.query.compress,
                })
              ).body

        res.setHeader('content-disposition', 'attachment')
        await pipeline(stream, res)
      })
    )

    api.get('/:collection/:object', (req, res) => {
      let result = req.object

      // add locations of sub-routes for discoverability
      const { routes } = req.collection
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

    api.get(
      '/:collection/:object/tasks',
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
      })
    )

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
      const { action } = req.params
      const fn = req.collection.actions?.[action]
      if (fn === undefined) {
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
        const handler = req.collection.routes?.[req.params.route]
        if (handler !== undefined) {
          return handler(req, res, next)
        }
        return next()
      })
    )

    api.post(
      '/:collection(pools)/:object/vms',
      wrap(async (req, res) => {
        let srRef
        const { sr } = req.params
        if (sr !== undefined) {
          srRef = app.getXapiObject(sr, 'SR').$ref
        }

        const { $xapi } = req.xapiObject
        const ref = await $xapi.VM_import(req, srRef)

        res.end(await $xapi.getField('VM', ref, 'uuid'))
      })
    )

    api.post(
      '/:collection(srs)/:object/vdis',
      wrap(async (req, res) => {
        const sr = req.xapiObject
        req.length = +req.headers['content-length']

        const { name_label, name_description, raw } = req.query
        const vdiRef = await sr.$importVdi(req, {
          format: raw !== undefined ? VDI_FORMAT_RAW : VDI_FORMAT_VHD,
          name_label,
          name_description,
        })

        res.end(await sr.$xapi.getField('VDI', vdiRef, 'uuid'))
      })
    )

    api.delete(
      '/:collection(vdis|vdi-snapshots|vms|vm-snapshots|vm-templates)/:object',
      wrap(async (req, res) => {
        await req.xapiObject.$destroy()
        res.sendStatus(200)
      })
    )
  }

  registerRestApi(spec, base = '/') {
    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const handler = spec[path]
        this.#api[path.slice(1)](base, json(), async (req, res, next) => {
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
      throw new Error('not implemented')
    }
  }
}
