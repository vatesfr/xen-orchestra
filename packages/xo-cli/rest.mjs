import { basename, join } from 'node:path'
import { createWriteStream } from 'node:fs'
import { normalize } from 'node:path/posix'
import { parse as parseContentType } from 'content-type'
import { pipeline } from 'node:stream'
import { pipeline as pPipeline } from 'node:stream/promises'
import { readChunk } from '@vates/read-chunk'
import getopts from 'getopts'
import hrp from 'http-request-plus'
import merge from 'lodash/merge.js'
import set from 'lodash/set.js'
import split2 from 'split2'

const PREFIX = '/rest/v0/'

function addPrefix(suffix) {
  const path = normalize(PREFIX + stripPrefix(suffix))
  if (!path.startsWith(PREFIX)) {
    throw new Error('invalid path')
  }
  return path
}

const noop = Function.prototype

function parseParams(args) {
  const params = {}
  for (const arg of args) {
    const i = arg.indexOf('=')
    if (i === -1) {
      set(params, arg, '')
    } else {
      const value = arg.slice(i + 1)
      set(params, arg.slice(0, i), value.startsWith('json:') ? JSON.parse(value.slice(5)) : value)
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

  async get(args) {
    const {
      _: [path, ...rest],
      output,
    } = getopts(args, {
      alias: { output: 'o' },
      string: 'output',
      stopEarly: true,
    })

    const response = await this.exec(path, { query: parseParams(rest) })

    if (output !== '') {
      return pPipeline(
        response,
        output === '-'
          ? process.stdout
          : createWriteStream(output.endsWith('/') ? join(output, basename(path)) : output, { flags: 'wx' })
      )
    }

    const { type } = parseContentType(response)
    if (type === 'application/json') {
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
    } else if (type === 'application/x-ndjson') {
      const lines = pipeline(response, split2(), noop)
      let line
      while ((line = await readChunk(lines)) !== null) {
        const data = JSON.parse(line)
        console.log(this.json ? JSON.stringify(data, null, 2) : data)
      }
    } else {
      throw new Error('unsupported content-type ' + type)
    }
  },

  async patch([path, ...params]) {
    const response = await this.exec(path, {
      body: JSON.stringify(parseParams(params)),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PATCH',
    })

    return await response.text()
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

  async put([path, ...params]) {
    const response = await this.exec(path, {
      body: JSON.stringify(parseParams(params)),
      headers: {
        'content-type': 'application/json',
      },
      method: 'PUT',
    })

    return stripPrefix(await response.text())
  },
}

export async function rest(args) {
  const {
    json = false,
    _: [command, ...rest],
  } = getopts(args, { boolean: ['json'], stopEarly: true })

  const { allowUnauthorized, server, token } = await this.getServerConfig()

  const baseUrl = server
  const baseOpts = {
    headers: {
      cookie: 'authenticationToken=' + token,
    },
    rejectUnauthorized: !allowUnauthorized,
    timeout: 0,
  }

  if (command === undefined || !(command in COMMANDS)) {
    return console.log('Available commands: ', Object.keys(COMMANDS).sort().join(', '))
  }

  return COMMANDS[command].call(
    {
      async exec(path, { query = {}, ...opts } = {}) {
        const url = new URL(baseUrl)

        const i = path.indexOf('?')
        let pathname
        if (i === -1) {
          pathname = path
        } else {
          pathname = path.slice(0, i)
          url.search = path.slice(i)
        }
        url.pathname = addPrefix(pathname)

        for (const [name, value] of Object.entries(query)) {
          if (value !== undefined) {
            url.searchParams.set(name, value)
          }
        }

        try {
          return await hrp(url, merge({}, baseOpts, opts))
        } catch (error) {
          const { response } = error
          if (response === undefined) {
            throw error
          }

          console.error(response.statusCode, response.statusMessage)
          throw await response.text()
        }
      },
      json,
    },
    rest
  )
}
