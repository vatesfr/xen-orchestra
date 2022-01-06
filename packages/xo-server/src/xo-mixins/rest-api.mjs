import { ifDef } from '@xen-orchestra/defined'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'stream'
import { Router } from 'express'
import createNdJsonStream from '../_createNdJsonStream.mjs'
import pick from 'lodash/pick.js'
import map from 'lodash/map.js'
import * as CM from 'complex-matcher'

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

    const vms = subRouter(api, '/vms')

    vms.get('/', async (req, res) => {
      const { query } = req
      const basePath = req.baseUrl + req.path
      const makeUrl = vm => basePath + vm.id

      let filter
      let userFilter = req.query.filter
      if (userFilter) {
        userFilter = CM.parse(userFilter).createPredicate()
        filter = obj => obj.type === 'VM' && userFilter(obj)
      } else {
        filter = obj => obj.type === 'VM'
      }

      const vms = await app.getObjects({ filter, limit: ifDef(query.limit, Number) })

      let { fields } = query
      let results
      if (fields !== undefined) {
        fields = fields.split(',')
        results = map(vms, vm => {
          const url = makeUrl(vm)
          vm = pick(vm, fields)
          vm.url = url
          return vm
        })
      } else {
        results = map(vms, makeUrl)
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

    vms.get('/:id', async (req, res, next) => {
      try {
        res.json(await app.getObject(req.params.id, 'VM'))
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
