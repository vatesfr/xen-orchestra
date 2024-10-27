import CM from 'complex-matcher'
import { every } from '@vates/predicates'
import AbstractEntity from './AbstractEntity.mjs'
import pick from 'lodash/pick.js'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
class AbstractXapiCollection extends AbstractEntity {
  getObject(uuid) {
    return this.getApp().getObject(uuid, this.getType())
  }

  getObjects(filter, limit, fields) {
    filter = filter !== undefined ? CM.parse(filter).createPredicate() : undefined

    let objects = this.getApp().getObjects({
      filter: every(obj => obj.type === this.getType(), filter),
      limit,
    })

    if (fields === undefined) {
      objects = Object.keys(objects)
    } else {
      objects = Object.values(objects)
      if (fields !== '*') {
        const properties = fields.split(',')
        objects = objects.map(obj => pick(obj, properties))
      }
    }

    return objects
  }

  registerRoutes() {
    this.getRouter()
      .param('uuid', (req, res, next) => {
        const uuid = req.params.uuid

        if (typeof uuid !== 'string' || !uuidRegex.test(uuid)) {
          return next(new Error('invalid uuid'))
        }

        res.locals.object = this.getObject(uuid)
        next()
      })
      .get(`/`, (req, res) => {
        const objects = this.getObjects(req.query.filter, req.query.limit, req.query.fields)

        this.sendObjects(objects, req, res)
      })
      .get(`/:uuid`, (req, res) => {
        const fields = req.query.fields
        let obj = res.locals.object
        if (fields !== undefined && fields !== '*') {
          obj = pick(obj, fields.split())
        }

        res.json(obj)
      })
  }
}

export default AbstractXapiCollection
