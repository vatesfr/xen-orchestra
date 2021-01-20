#!/usr/bin/env node

import assert from 'assert'
import contentType from 'content-type'
import fromCallback from 'promise-toolbox/fromCallback'
import fs from 'fs'
import getopts from 'getopts'
import hrp from 'http-request-plus'
import pump from 'pump'
import split2 from 'split2'
import pumpify from 'pumpify'
import { extname, join } from 'path'
import { format, parse } from 'json-rpc-protocol'
import { inspect } from 'util'
import { load as loadConfig } from 'app-conf'
import { readChunk } from '@vates/read-chunk'

import pkg from '../package.json'

const parseValue = value => (value.startsWith('json:') ? JSON.parse(value.slice(5)) : value)

async function main(argv) {
  const config = await loadConfig('xo-proxy', {
    appDir: join(__dirname, '..'),
    ignoreUnknownFormats: true,
  })

  const { hostname = 'localhost', port } = config?.http?.listen?.https ?? {}

  const { _: args, file, help, host, raw, token } = getopts(argv, {
    alias: { file: 'f', help: 'h' },
    boolean: ['help', 'raw'],
    default: {
      token: config.authenticationToken,
    },
    stopEarly: true,
    string: ['file', 'host', 'token'],
  })

  if (help || (file === '' && args.length === 0)) {
    return console.log(
      '%s',
      `Usage:

  xo-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.

  xo-proxy-cli [--file | -f] <file>
    Read a JSON file containing an object with \`method\` and \`params\`
    properties and call the API method.

${pkg.name} v${pkg.version}`
    )
  }

  const call = async (method, params) => {
    const request = {
      body: format.request(0, method, params),
      headers: {
        'content-type': 'application/json',
        cookie: `authenticationToken=${token}`,
      },
      pathname: '/api/v1',
      protocol: 'https:',
      rejectUnauthorized: false,
    }
    if (host !== '') {
      request.host = host
    } else {
      request.hostname = hostname
      request.port = port
    }

    const response = await hrp.post(request)

    const { stdout } = process

    const responseType = contentType.parse(response).type
    if (responseType === 'application/octet-stream') {
      if (stdout.isTTY) {
        throw new Error('binary data, pipe to a file!')
      }
      await fromCallback(pump, response, stdout)
      return
    }

    assert.strictEqual(responseType, 'application/json')
    const lines = pumpify.obj(response, split2())

    const firstLine = await readChunk(lines)

    try {
      const result = await parse.result(firstLine)
      if (
        result !== null &&
        typeof result === 'object' &&
        Object.keys(result).length === 1 &&
        result.$responseType === 'ndjson'
      ) {
        let line
        while ((line = await readChunk(lines)) !== null) {
          stdout.write(inspect(JSON.parse(line), { colors: true, depth: null }))
          stdout.write('\n')
        }
      } else if (raw && typeof result === 'string') {
        stdout.write(result)
      } else {
        process.stdout.write(inspect(result, { colors: true, depth: null }))
        stdout.write('\n')
      }
    } catch (error) {
      if (!(error?.code === 10 && 'errors' in error.data)) {
        throw error
      }

      // we should be able to do better but the messages returned by ajv are not
      // precise enough
      //
      // see https://github.com/epoberezkin/ajv/issues/1099
      throw error.data.errors
    }
  }

  if (file !== '') {
    let data = fs.readFileSync(file, 'utf8')
    const ext = extname(file).slice(1).toLowerCase()
    data =
      ext === 'json'
        ? JSON.parse(data)
        : (() => {
            throw new Error(`unsupported file: ${file}`)
          })()

    return call(data.method, data.params)
  } else {
    const method = args[0]
    const params = {}
    for (let i = 1, n = args.length; i < n; ++i) {
      const param = args[i]
      const j = param.indexOf('=')
      if (j === -1) {
        throw new Error(`invalid param format: ${param}`)
      }
      params[param.slice(0, j)] = parseValue(param.slice(j + 1))
    }

    return call(method, params)
  }
}
main(process.argv.slice(2)).then(
  () => {
    process.exit(0)
  },
  error => {
    console.error('exception in main:', error)

    process.exit(1)
  }
)
