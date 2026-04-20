import pick from 'lodash/pick.js'
import { Request } from 'express'
import type { XoRecord } from '@vates/types'

import { BASE_URL } from '../index.mjs'
import type { WithHref } from './helper.type.mjs'

export function makeObjectMapper<T extends XoRecord>(req: Request, path?: string | ((obj: T) => string)) {
  const makeUrl = (obj: T) => {
    let _path = path === undefined ? req.path : typeof path === 'string' ? path : path(obj)
    if (_path.startsWith('/')) {
      _path = _path.slice(1)
    }
    if (_path.endsWith('/')) {
      _path = _path.slice(0, -1)
    }

    return `${BASE_URL}/${_path}/${String(obj.id)}`
  }
  let objectMapper: (object: T) => string | WithHref<Partial<T>> | WithHref<T>

  const { query } = req
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
