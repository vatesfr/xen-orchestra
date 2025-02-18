import path from 'node:path'
import pick from 'lodash/pick.js'
import { Request } from 'express'

import type { WithHref } from './helper.type.mjs'
import { XapiXoRecordByType } from '../rest-api/rest-api.type.mjs'

const { join } = path.posix

export function makeObjectMapper<T extends keyof XapiXoRecordByType>(req: Request, path = req.path) {
  type XapiXoRecord = XapiXoRecordByType[T]

  const makeUrl = ({ id }: XapiXoRecord) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)
  let objectMapper: (object: XapiXoRecord) => string | WithHref<Partial<XapiXoRecord>> | WithHref<XapiXoRecord>

  const { query, baseUrl } = req
  const { fields } = query
  if (fields === '*') {
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
    objectMapper = makeUrl
  }

  return function (obj: XapiXoRecord) {
    return objectMapper(obj)
  }
}
