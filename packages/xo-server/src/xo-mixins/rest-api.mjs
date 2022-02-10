import { every } from '@vates/predicates'
import { ifDef } from '@xen-orchestra/defined'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'stream'
import { Router } from 'express'
import createNdJsonStream from '../_createNdJsonStream.mjs'
import pick from 'lodash/pick.js'
import map from 'lodash/map.js'
import * as CM from 'complex-matcher'

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()

const subRouter = (app, path) => {
  const router = Router({ strict: true })
  app.use(path, router)
  return router
}

export default class RestApi {
  constructor(app, { express }) {
    const api = subRouter(express, '/rest/v0')

    api.use(({ cookies }, res, next) => {
      app.authenticateUser({ token: cookies.authenticationToken ?? cookies.token }).then(
        () => {
          next()
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

    for (const [path, type] of Object.entries({
      '/hosts': 'host',
      '/pools': 'pool',
      '/vms': 'VM',
      '/srs': 'SR',
    })) {
      const isCorrectType = _ => _.type === type

      subRouter(api, path)
        .get('/', async (req, res) => {
          const { query } = req
          const basePath = req.baseUrl + req.path
          const makeUrl = object => basePath + object.id

          const objects = await app.getObjects({
            filter: every(isCorrectType, handleOptionalUserFilter(req.query.filter)),
            limit: ifDef(query.limit, Number),
          })

          let { fields } = query
          let results
          if (fields !== undefined) {
            fields = fields.split(',')
            results = map(objects, object => {
              const url = makeUrl(object)
              object = pick(object, fields)
              object.href = url
              return object
            })
          } else {
            results = map(objects, makeUrl)
          }

          if (query.ndjson !== undefined) {
            res.set('Content-Type', 'application/x-ndjson')
            pipeline(createNdJsonStream(results), res, error => {
              if (error !== undefined) {
                console.warn('pipeline error', error)
              }
            })
          } else {
            res.json(results)
          }
        })
        .get('/:id', async (req, res, next) => {
          try {
            res.json(await app.getObject(req.params.id, type))
          } catch (error) {
            if (noSuchObject.is(error)) {
              next()
            } else {
              next(error)
            }
          }
        })
    }
  }
}
