import { normalize } from 'node:path/posix'
import getopts from 'getopts'
import hrp from 'http-request-plus'
import merge from 'lodash/merge.js'

import * as config from './config.mjs'

const PREFIX = '/rest/v0/'

function addPrefix(suffix) {
  const path = normalize(PREFIX + stripPrefix(suffix))
  if (!path.startsWith(PREFIX)) {
    throw new Error('invalid path')
  }
  return path
}

function parseParams(args) {
  const params = {}
  for (const arg of args) {
    const i = arg.indexOf('=')
    if (i === -1) {
      params[arg] = ''
    } else {
      params[arg.slice(0, i)] = arg.slice(i + 1)
    }
  }
  return params
}

function stripPrefix(path) {
  path = normalize('/' + path)
  return path.startsWith(PREFIX) ? path.slice(PREFIX.length) : path
}

const COMMANDS = {
  async del(args) {
    const {
      _: [path = ''],
    } = getopts(args)
    const response = await this.exec(path, { method: 'DELETE' })
    return await response.text()
  },

  async get([path, ...args]) {
    const response = await this.exec(path, { query: parseParams(args) })

    const result = await response.json()

    if (Array.isArray(result)) {
      for (let i = 0, n = result.length; i < n; ++i) {
        const value = result[i]
        if (typeof value === 'string') {
          result[i] = stripPrefix(value)
        } else if (value != null && typeof value.href === 'string') {
          value.href = stripPrefix(value.href)
        }
      }
    }

    return this.json ? JSON.stringify(result, null, 2) : result
  },

  async post([path, ...params]) {
    const response = await this.exec(path, {
      body: JSON.stringify(parseParams(params)),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    return stripPrefix(await response.text())
  },
}

export async function rest(args) {
  const {
    json = false,
    _: [command, ...rest],
  } = getopts(args, { boolean: ['json'], stopEarly: true })

  const { allowUnauthorized, server, token } = await config.load()

  const baseUrl = server
  const baseOpts = {
    headers: {
      cookie: 'authenticationToken=' + token,
    },
    rejectUnauthorized: !allowUnauthorized,
  }

  if (command === undefined || !(command in COMMANDS)) {
    return console.log('Available commands: ', Object.keys(COMMANDS).sort().join(', '))
  }

  return COMMANDS[command].call(
    {
      exec(path, { query = {}, ...opts } = {}) {
        const url = new URL(baseUrl)
        url.pathname = addPrefix(path)
        for (const [name, value] of Object.entries(query)) {
          if (value !== undefined) {
            url.searchParams.set(name, value)
          }
        }
        return hrp(url, merge({}, baseOpts, opts))
      },
      json,
    },
    rest
  )
}
