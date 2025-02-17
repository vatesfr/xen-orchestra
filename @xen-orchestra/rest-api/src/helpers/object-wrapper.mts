import path from 'node:path'
import pick from 'lodash/pick.js'
import { Request } from 'express'

import { XapiXoRecordByType } from '../rest-api/rest-api.type.mjs'

const { join } = path.posix

export function makeObjectMapper<T extends keyof XapiXoRecordByType>(req: Request, path = req.path) {
  type XapiXoRecord = XapiXoRecordByType[T]
  const { query, baseUrl } = req

  const makeUrl = ({ id }: XapiXoRecord) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let objectMapper: (object: XapiXoRecord) => string | any

  const { fields } = query
  if (fields === undefined) {
    objectMapper = makeUrl
  } else if (fields === '*') {
    objectMapper = object => ({
      ...object,
      href: makeUrl(object),
    })
  } else if (typeof fields === 'string') {
    const _fields = fields.split(',')
    objectMapper = object => {
      const url = makeUrl(object)
      return { ...pick(object, _fields), href: url }
    }
  } else {
    throw new Error('something goes wrong with `fields` query string')
  }

  return function (obj: XapiXoRecord) {
    return objectMapper(obj)
  }
}
