import { every } from '@vates/predicates'
import { ifDef } from '@xen-orchestra/defined'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { json, Router } from 'express'
import path from 'node:path'
import pick from 'lodash/pick.js'
import * as CM from 'complex-matcher'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from '@xen-orchestra/xapi'

const { join } = path.posix
const noop = Function.prototype

async function* makeObjectsStream(iterable, makeResult, json) {
  // use Object.values() on non-iterable objects
  if (
    iterable != null &&
    typeof iterable === 'object' &&
    typeof iterable[Symbol.iterator] !== 'function' &&
    typeof iterable[Symbol.asyncIterator] !== 'function'
  ) {
    iterable = Object.values(iterable)
  }

  if (json) {
    yield '['
    let first = true
    for await (const object of iterable) {
      if (first) {
        first = false
        yield '\n'
      } else {
        yield ',\n'
      }
      yield JSON.stringify(makeResult(object), null, 2)
    }
    yield '\n]\n'
  } else {
    for await (const object of iterable) {
      yield JSON.stringify(makeResult(object))
      yield '\n'
    }
  }
}

async function sendObjects(iterable, req, res, path = req.path) {
  const { query } = req

  const basePath = join(req.baseUrl, path)
  const makeUrl = object => join(basePath, object.id)

  let makeResult
  let { fields } = query
  if (fields === undefined) {
    makeResult = makeUrl
  } else if (fields === '*') {
    makeResult = object => ({
      ...object,
      href: makeUrl(object),
    })
  } else if (fields) {
    fields = fields.split(',')
    makeResult = object => {
      const url = makeUrl(object)
      object = pick(object, fields)
      object.href = url
      return object
    }
  }

  const json = !Object.hasOwn(query, 'ndjson')

  res.setHeader('content-type', json ? 'application/json' : 'application/x-ndjson')
  return pipeline(makeObjectsStream(iterable, makeResult, json, res), res)
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
      if (handleNoSuchObject && noSuchObject.is(error)) {
        res.sendStatus(404)
      } else {
        next(error)
      }
    }
  }
}

export default class RestApi {
  constructor(app, { express }) {
    // don't setup the API if express is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const api = subRouter(express, '/rest/v0')

    api.use(({ cookies }, res, next) => {
      app.authenticateUser({ token: cookies.authenticationToken ?? cookies.token }).then(
        ({ user }) => {
          if (user.permission === 'admin') {
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

    const types = [
      'host',
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
    const collections = Object.fromEntries(
      types.map(type => {
        const id = type.toLocaleLowerCase() + 's'
        return [id, { id, isCorrectType: _ => _.type === type, type }]
      })
    )

    collections.backups = { id: 'backups' }
    collections.restore = { id: 'restore' }
    collections.tasks = { id: 'tasks' }

    collections.vms.actions = {
      __proto__: null,

      clean_reboot: vm => vm.$callAsync('clean_reboot').then(noop),
      clean_shutdown: vm => vm.$callAsync('clean_shutdown').then(noop),
      hard_reboot: vm => vm.$callAsync('hard_reboot').then(noop),
      hard_shutdown: vm => vm.$callAsync('hard_shutdown').then(noop),
      snapshot: async (vm, { name_label }) => {
        const ref = await vm.$snapshot({ name_label })
        return vm.$xapi.getField('VM', ref, 'uuid')
      },
      start: vm => vm.$callAsync('start', false, false).then(noop),
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
    api.param('object', (req, res, next) => {
      const id = req.params.object
      const { type } = req.collection
      try {
        req.xapiObject = app.getXapiObject((req.xoObject = app.getObject(id, type)))
        next()
      } catch (error) {
        if (noSuchObject.is(error, { id, type })) {
          next('route')
        } else {
          next(error)
        }
      }
    })

    api.get(
      '/',
      wrap((req, res) => sendObjects(collections, req, res))
    )

    api
      .get(
        '/backups',
        wrap((req, res) => sendObjects([{ id: 'jobs' }, { id: 'logs' }], req, res))
      )
      .get(
        '/backups/jobs',
        wrap(async (req, res) => sendObjects(await app.getAllJobs('backup'), req, res))
      )
      .get(
        '/backups/jobs/:id',
        wrap(async (req, res) => {
          res.json(await app.getJob(req.params.id, 'backup'))
        })
      )
      .get(
        '/backups/logs',
        wrap(async (req, res) => {
          const logs = await app.getBackupNgLogsSorted({
            filter: ({ message: m }) => m === 'backup' || m === 'metadata',
          })
          await sendObjects(logs, req, res)
        })
      )
      .get(
        '/restore',
        wrap((req, res) => sendObjects([{ id: 'logs' }], req, res))
      )
      .get(
        '/restore/logs',
        wrap(async (req, res) => {
          const logs = await app.getBackupNgLogsSorted({ filter: _ => _.message === 'restore' })
          await sendObjects(logs, req, res)
        })
      )
      .get(
        ['/backups/logs/:id', '/restore/logs/:id'],
        wrap(async (req, res) => {
          res.json(await app.getBackupNgLogs(req.params.id))
        })
      )

    api
      .get(
        '/tasks',
        wrap(async (req, res) => {
          const { filter, limit } = req.query
          const tasks = app.tasks.list({
            filter: handleOptionalUserFilter(filter),
            limit: ifDef(limit, Number),
          })
          await sendObjects(tasks, req, res)
        })
      )
      .delete(
        '/tasks',
        wrap(async (req, res) => {
          await app.tasks.clearLogs()
          res.sendStatus(200)
        })
      )
      .get(
        '/tasks/:id',
        wrap(async (req, res) => {
          const {
            params: { id },
            query: { wait },
          } = req
          if (wait !== undefined) {
            const stopWatch = await app.tasks.watch(id, task => {
              if (wait !== 'result' || task.status !== 'pending') {
                stopWatch()
                res.json(task)
              }
            })
            req.on('close', stopWatch)
          } else {
            res.json(await app.tasks.get(id))
          }
        }, true)
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
        const { query } = req
        await sendObjects(
          await app.getObjects({
            filter: every(req.collection.isCorrectType, handleOptionalUserFilter(query.filter)),
            limit: ifDef(query.limit, Number),
          }),
          req,
          res
        )
      })
    )

    // should go before routes /:collection/:object because they will match but
    // will not work due to the extension being included in the object identifer
    api.get(
      '/:collection(vdis|vdi-snapshots)/:object.:format(vhd|raw)',
      wrap(async (req, res) => {
        const stream = await req.xapiObject.$exportContent({ format: req.params.format })

        stream.headers['content-disposition'] = 'attachment'
        res.writeHead(stream.statusCode, stream.statusMessage != null ? stream.statusMessage : '', stream.headers)

        await pipeline(stream, res)
      })
    )
    api.get(
      '/:collection(vms|vm-snapshots|vm-templates)/:object.xva',
      wrap(async (req, res) => {
        const stream = await req.xapiObject.$export({ compress: req.query.compress })

        stream.headers['content-disposition'] = 'attachment'
        res.writeHead(stream.statusCode, stream.statusMessage != null ? stream.statusMessage : '', stream.headers)

        await pipeline(stream, res)
      })
    )

    api.get('/:collection/:object', (req, res) => {
      res.json(req.xoObject)
    })
    api.patch(
      '/:collection/:object',
      json(),
      wrap(async (req, res) => {
        const obj = req.xapiObject

        const promises = []
        const { body } = req
        for (const key of ['name_description', 'name_label']) {
          const value = body[key]
          if (value !== undefined) {
            promises.push(obj['set_' + key](value))
          }
        }
        await promises
        res.sendStatus(200)
      })
    )

    api.get(
      '/:collection/:object/tasks',
      wrap(async (req, res) => {
        const { query } = req
        const objectId = req.xoObject.id
        const tasks = app.tasks.list({
          filter: every(_ => _.status === 'pending' && _.objectId === objectId, handleOptionalUserFilter(query.filter)),
          limit: ifDef(query.limit, Number),
        })
        await sendObjects(tasks, req, res, req.baseUrl + '/tasks')
      })
    )

    api.get(
      '/:collection/:object/actions',
      wrap((req, res) => {
        const { actions } = req.collection
        return sendObjects(actions === undefined ? [] : Array.from(Object.keys(actions), id => ({ id })), req, res)
      })
    )
    api.post('/:collection/:object/actions/:action', json(), (req, res, next) => {
      const { action } = req.params
      const fn = req.collection.actions?.[action]
      if (fn === undefined) {
        return next()
      }

      const task = app.tasks.create({ name: `REST: ${action} ${req.collection.type}`, objectId: req.xoObject.id })
      const pResult = task.run(() => fn(req.xapiObject, req.body))
      if (Object.hasOwn(req.query, 'sync')) {
        pResult.then(result => res.json(result), next)
      } else {
        pResult.catch(noop)
        res.statusCode = 202
        res.end(req.baseUrl + '/tasks/' + task.id)
      }
    })

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
}
