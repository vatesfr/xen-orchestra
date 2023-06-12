import { createGzip } from 'node:zlib'
import { every } from '@vates/predicates'
import { featureUnauthorized, invalidCredentials } from 'xo-common/api-errors.js'
import { ifDef } from '@xen-orchestra/defined'
import { pipeline } from 'node:stream/promises'
import { stringify as csvStringify } from 'csv-stringify'
import * as CM from 'complex-matcher'
import assert from 'node:assert/strict'
import path from 'node:path'
import pick from 'lodash/pick.js'

import { getUserPublicProperties } from '../utils.mjs'

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

const FORMATS = {
  __proto__: null,

  csv(iterable, res, { query: { fields } }) {
    res.setHeader('content-type', 'text/csv')

    return pipeline(iterable, csvStringify({ columns: fields?.split(','), header: true }), res)
  },

  json(iterable, res, req) {
    res.setHeader('content-type', 'application/json')

    return pipeline(async function* () {
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
    }, res)
  },

  ndjson(iterable, res, req) {
    res.setHeader('content-type', 'application/x-ndjson')
    return pipeline(async function* () {
      for await (const object of iterable) {
        yield JSON.stringify(object)
        yield '\n'
      }
    }, res)
  },
}

async function* itMap(iterable, cb) {
  for await (const value of iterable) {
    yield cb(value)
  }
}

async function* collectionMap(iterable, req) {
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

  for await (const entry of iterable) {
    yield makeResult(entry)
  }
}

// async function sendCollection(iterable, req, res, format, path = req.path) {
//   const { query } = req

//   const basePath = join(req.baseUrl, path)
//   const makeUrl = id => join(basePath, id)

//   let makeResult
//   let { fields } = query
//   if (fields === undefined) {
//     makeResult = makeUrl
//   } else if (fields === '*') {
//     makeResult = object =>
//       typeof object === 'string' ? { id: object, href: makeUrl(object) } : { ...object, href: makeUrl(object.id) }
//   } else if (fields) {
//     fields = fields.split(',')
//     makeResult = object => {
//       if (typeof object === 'string') {
//         object = { id: object }
//       }
//       const url = makeUrl(object)
//       object = pick(object, fields)
//       object.href = url
//       return object
//     }
//   }

//   const json = format === 'json'
//   if (!json) {
//     assert.equal(format, 'ndjson')
//   }

//   res.setHeader('content-type', json ? 'application/json' : 'application/x-ndjson')
//   return pipeline(makeObjectsStream(iterable, makeResult, json, res), res)
// }

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()

export default class RestApi {
  #root = new Map()

  constructor(app, { express }) {
    // don't setup the API if express is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const root = this.#root
    express.use('/rest/v0/', async function (req, res, next) {
      try {
        try {
          const { token, authenticationToken = token } = req.cookies
          const user = await app.authenticateUser({ token: authenticationToken })
          if (user.permission === 'admin') {
            return res.sendStatus(401)
          }
        } catch (error) {
          if (invalidCredentials.is(error)) {
            return res.sendStatus(401)
          }

          throw error
        }

        req.parts = []

        let node = root

        let format = Object.hasOwn(req.query, 'ndjson') ? 'ndjson' : 'json'

        const { path } = req
        if (path.length !== 1) {
          const keys = path.slice(1).split('/')
          const n = keys.length

          for (let i = 0; i < n; ++i) {
            let key = keys[i]

            const isLastPart = i === n - 1
            if (isLastPart) {
              const j = key.lastIndexOf('.')
              if (j !== -1) {
                format = key.slice(j + 1)
                key = key.slice(0, j)
              }
            }

            if (key[0] === '_') {
              return next()
            }

            let nextNode = node.get(key)
            if (nextNode === undefined) {
              nextNode = node.get('_')
              if (nextNode === undefined) {
                return next()
              }
              req.parts.unshift(key)
            }
            node = nextNode
          }
        }

        const { method } = req
        let fn = node.get('_' + method.toLowerCase())
        if (fn === undefined) {
          if (method !== 'GET') {
            return next()
          }

          fn = () => Array.from(node.keys()).filter(key => key[0] !== '_')
        }

        let result = await fn.apply(this, arguments)

        if (result !== undefined) {
          if (result !== null && typeof result === 'object') {
            if (typeof result[Symbol.iterator] === 'function' || typeof result[Symbol.asyncIterator] === 'function') {
              const fn = FORMATS[format]
              assert.notEqual(fn, undefined)

              return fn(result, res, req)
            }

            // augment the returned object with subroutes URLs
            result = { ...result }
            for (const key of node.keys()) {
              if (key[0] !== '_') {
                result[key.split('.')[0] + '_href'] = join(req.baseUrl, req.path, key)
              }
            }
          }

          assert.equal(format, 'json')

          return res.json(result)
        }
      } catch (error) {
        if (featureUnauthorized.is(error)) {
          return res.sendStatus(403)
        }

        return next(error)
      }
    })

    this.addToRestApi({
      // /backups
      backups: {
        // /backups/jobs
        jobs: {
          // GET method on the current path
          _get: async () => Object.values(await app.getAllJobs('backup')),

          // /backups/jobs/* fallback route
          _: {
            _get: req => app.getJob(req.parts[0], 'backup'),
          },
        },
        logs: {
          _get: () => app.getBackupNgLogsSorted({ filter: ({ message: m }) => m === 'backup' || m === 'metadata' }),

          _: {
            _get: req => app.getBackupNgLogs(req.parts[0]),
          },
        },
      },
      restore: {
        logs: {
          _get: () => app.getBackupNgLogsSorted({ filter: _ => _.message === 'restore' }),

          _: {
            _get: req => app.getBackupNgLogs(req.parts[0]),
          },
        },
      },

      hosts: {
        _: {
          async 'audit.txt'(req, res) {
            const host = app.getXapiObject(req.parts[0])

            res.setHeader('content-type', 'text/plain')
            await pipeline(await host.$xapi.getResource('/audit_log', { host }), compressMaybe(req, res))
          },

          async 'logs.tar'(req, res) {
            const host = app.getXapiObject(req.parts[0])

            res.setHeader('content-type', 'application/x-tar')
            await pipeline(await host.$xapi.getResource('/host_logs_download', { host }), compressMaybe(req, res))
          },
        },
      },

      tasks: {
        _delete: async (req, res) => {
          await app.tasks.clearLogs()
          res.sendStatus(200)
        },
        _get: ({ query: { filter, limit } }) =>
          collectionMap(
            app.tasks.list({
              filter: handleOptionalUserFilter(filter),
              limit: ifDef(limit, Number),
            })
          ),

        _: {
          _actions: {
            abort: {
              enabled: async req => {
                const task = await app.tasks.get(req.parts[0])
                return task.status === 'pending'
              },
              run: async (req, res) => {
                const [id] = req.parts
                await app.tasks.abort(id)
                res.status = 202
                res.end(req.baseUrl + '/tasks/' + id) // @FIXME
              },
            },
          },
          _delete: async (req, res) => {
            await app.tasks.deleteLog(req.parts[0])
            res.sendStatus(200)
          },
          _get: async (req, res) => {
            const {
              parts: [id],
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
          },
        },
      },

      users: {
        _get: async (req, res) => {
          let users = await app.getAllUsers()

          const { filter, limit } = req.query
          if (filter !== undefined) {
            users = users.filter(CM.parse(filter).createPredicate())
          }
          if (limit < users.length) {
            users.length = limit
          }

          return collectionMap(users.map(getUserPublicProperties), req)
        },

        _: {
          _get: async (req, res) => {
            res.json(getUserPublicProperties(await app.getUser(req.parts[0])))
          },
        },
      },
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
    for (const type of types) {
      const id = type.toLocaleLowerCase() + 's'
      const isCorrectType = _ => _.type === type
      this.addToRestApi({
        [id]: {
          _get: ({ query, fields }) => {
            collectionMap(
              Object.values(
                app.getObjects({
                  filter: every(isCorrectType, handleOptionalUserFilter(query.filter)),
                  limit: ifDef(query.limit, Number),
                })
              )
            )
          },
        },
      })
    }
  }

  addToRestApi(spec) {
    const add = (node, spec) => {
      for (const key of Object.keys(spec)) {
        if (key.length !== 1 && key[0] === '_') {
          if (node.has(key)) {
            throw new Error('duplicate entry')
          }
          node.set(key, spec[key])
        } else {
          let current = node.get(key)
          if (current === undefined) {
            current = new Map()
            node.set(key, current)
          }
          add(current, spec[key])
        }
      }
    }
    return add(this.#root, spec)
  }
}
