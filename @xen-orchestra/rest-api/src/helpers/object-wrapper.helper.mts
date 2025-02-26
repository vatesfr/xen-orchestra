import path from 'node:path'
import pick from 'lodash/pick.js'
import { Request } from 'express'
import type { XapiXoRecord } from '@vates/types'

import type { WithHref } from './helper.type.mjs'

const { join } = path.posix

export function makeObjectMapper<T extends XapiXoRecord>(req: Request, path = req.path) {
  const makeUrl = ({ id }: T) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)
  let objectMapper: (object: T) => string | WithHref<Partial<T>> | WithHref<T>

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

  return function (obj: T) {
    return objectMapper(obj)
  }
}
