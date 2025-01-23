import CM from 'complex-matcher'
import { every } from '@vates/predicates'
import AbstractEntity from './AbstractEntity.mjs'
import pick from 'lodash/pick.js'
import { noSuchObject } from 'xo-common/api-errors.js'
class AbstractCollection extends AbstractEntity {
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
      .param('uuid', async (req, res, next) => {
        const uuid = req.params.uuid

        try {
          res.locals.object = await this.getObject(uuid)
          next()
        } catch (error) {
          if (noSuchObject.is(error)) {
            return next('route')
          }
          next(error)
        }
      })
      .get(`/`, async (req, res) => {
        const objects = await this.getObjects(req.query.filter, req.query.limit, req.query.fields)

        this.sendObjects(objects, req, res)
      })
      .get(`/:uuid`, (req, res) => this.sendObject(res.locals.object, req, res))
  }
}

export default AbstractCollection
