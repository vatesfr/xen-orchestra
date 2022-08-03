import { every } from '@vates/predicates'
import { ifDef } from '@xen-orchestra/defined'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'stream'
import { Router } from 'express'
import createNdJsonStream from '../_createNdJsonStream.mjs'
import pick from 'lodash/pick.js'
import map from 'lodash/map.js'
import * as CM from 'complex-matcher'
import fromCallback from 'promise-toolbox/fromCallback'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from '@xen-orchestra/xapi'

function sendObjects(objects, req, res) {
  const { query } = req
  const basePath = req.baseUrl + req.path
  const makeUrl = object => basePath + object.id

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
}

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()

const subRouter = (app, path) => {
  const router = Router({ strict: true })
  app.use(path, router)
  return router
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

    const collections = [
      { id: 'hosts', type: 'host' },
      { id: 'networks', type: 'network' },
      { id: 'pools', type: 'pool' },
      { id: 'srs', type: 'SR' },
      { id: 'vbds', type: 'VBD' },
      { id: 'vdis', type: 'VDI' },
      { id: 'vifs', type: 'VIF' },
      { id: 'vms', type: 'VM' },
    ]

    api.get('/', (req, res) => sendObjects(collections, req, res))

    for (const { id, type } of collections) {
      const isCorrectType = _ => _.type === type

      subRouter(api, '/' + id)
        .get('/', async (req, res) => {
          const { query } = req
          sendObjects(
            await app.getObjects({
              filter: every(isCorrectType, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            }),
            req,
            res
          )
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

    api.post('/srs/:uuid/vdis', async (req, res, next) => {
      try {
        const sr = app.getXapiObject(req.params.uuid, 'SR')
        req.length = +req.headers['content-length']

        const { name_label, name_description, raw } = req.query
        const vdiRef = await sr.$importVdi(req, {
          format: raw !== undefined ? VDI_FORMAT_RAW : VDI_FORMAT_VHD,
          name_label,
          name_description,
        })

        res.end(await sr.$xapi.getField('VDI', vdiRef, 'uuid'))
      } catch (error) {
        if (noSuchObject.is(error)) {
          next()
        } else {
          next(error)
        }
      }
    })

    api.get('/vdis/:uuid.vhd', async (req, res, next) => {
      try {
        const vdi = app.getXapiObject(req.params.uuid, 'VDI')
        const stream = await vdi.$exportContent({ format: 'vhd' })

        stream.headers['content-disposition'] = 'attachment'
        res.writeHead(stream.statusCode, stream.statusMessage != null ? stream.statusMessage : '', stream.headers)

        await fromCallback(pipeline, stream, res)
      } catch (error) {
        if (noSuchObject.is(error)) {
          next()
        } else {
          next(error)
        }
      }
    })

    api.get('/vms/:uuid.xva', async (req, res, next) => {
      try {
        const vm = app.getXapiObject(req.params.uuid, 'VM')
        const stream = await vm.$export({ compress: req.query.compress })

        stream.headers['content-disposition'] = 'attachment'
        res.writeHead(stream.statusCode, stream.statusMessage != null ? stream.statusMessage : '', stream.headers)

        await fromCallback(pipeline, stream, res)
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
