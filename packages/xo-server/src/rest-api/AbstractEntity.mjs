import { Router } from 'express'
import { pipeline } from 'node:stream/promises'
import AbstractCollection from './AbstractCollection.mjs'
import pick from 'lodash/pick.js'

// @TODO Move to utils folder
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
// ---------

class AbstractEntity {
  #app
  #type
  #router
  constructor(app, type) {
    this.#app = app
    this.#type = type
    this.#router = new Router()
  }

  getApp() {
    return this.#app
  }

  getRouter() {
    return this.#router
  }

  getType() {
    return this.#type
  }

  registerRoutes() {
    throw new Error('Need to be implemented by the children entity')
  }

  registerRouter(router) {
    this.registerRoutes()

    const prefix = `/${this.getType().toLowerCase()}${this instanceof AbstractCollection ? 's' : ''}`
    router.use(prefix, this.getRouter())
  }

  sendObjects(iterable, req, res) {
    const ndjson = req.headers.accept === 'application/x-ndjson'
    res.setHeader('content-type', ndjson ? 'application/x-ndjson' : 'application/json')
    return pipeline((ndjson ? makeNdJsonStream : makeJsonStream)(iterable), res)
  }

  sendObject(object, req, res) {
    const fields = req.query.fields
    if (fields !== undefined && fields !== '*') {
      object = pick(object, fields.split())
    }

    res.json(object)
  }
}

export default AbstractEntity
