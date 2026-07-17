#!/usr/bin/env node

import assert from 'assert'
import colors from 'ansi-colors'
import contentType from 'content-type'
import CSON from 'cson-parser'
import fromCallback from 'promise-toolbox/fromCallback'
import fs from 'fs'
import getopts from 'getopts'
import split2 from 'split2'
import pumpify from 'pumpify'
import { Agent } from 'undici'
import { extname } from 'path'
import { format, parse } from 'json-rpc-protocol'
import { inspect } from 'util'
import { load as loadConfig } from 'app-conf'
import { pipeline, Readable } from 'stream'
import { readChunk } from '@vates/read-chunk'

const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url)))

// the proxy uses a self-signed certificate; timeouts disabled (0) because
// requests can be long running (the default 300s would cut them off)
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false }, headersTimeout: 0, bodyTimeout: 0 })

const FORMATS = {
  __proto__: null,

  cson: CSON.parse,
  json: JSON.parse,
}

const parseValue = value => (value.startsWith('json:') ? JSON.parse(value.slice(5)) : value)

async function main(argv) {
  const config = await loadConfig('xo-proxy', {
    ignoreUnknownFormats: true,
  })

  const opts = getopts(argv, {
    alias: { file: 'f', help: 'h' },
    boolean: ['help', 'raw'],
    default: {
      token: config.authenticationToken,
    },
    stopEarly: true,
    string: ['file', 'host', 'token', 'url'],
  })

  const { _: args, file } = opts

  if (opts.help || (file === '' && args.length === 0)) {
    return console.log(
      '%s',
      `Usage:

  xo-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.

  xo-proxy-cli [--file | -f] <file>
    Read a CSON or JSON file containing an object with \`method\` and \`params\`
    properties and call the API method.

    The file can also contain an array containing multiple calls, which will be
    run in sequence.

${pkg.name} v${pkg.version}`
    )
  }

  // sequence path of the current call
  const callPath = []

  let url
  let { token } = opts
  if (opts.url !== '') {
    url = new URL(opts.url)
    const { username } = url
    if (username !== '') {
      token = username
      url.username = ''
    }
  } else {
    url = new URL('https://localhost/')
    if (opts.host !== '') {
      url.host = opts.host
    } else {
      const { hostname = 'localhost', port } = config?.http?.listen?.https ?? {}
      url.hostname = hostname
      url.port = port
    }
  }

  url = new URL('/api/v1', url)
  const baseRequest = {
    headers: {
      'content-type': 'application/json',
      cookie: `authenticationToken=${token}`,
    },
    method: 'POST',
    dispatcher: insecureAgent,
  }

  const call = async ({ method, params }) => {
    if (callPath.length !== 0) {
      process.stderr.write(`\n${colors.bold(`--- call #${callPath.join('.')}`)} ---\n\n`)
    }

    const response = await fetch(url, {
      ...baseRequest,

      body: format.request(0, method, params),
    })
    if (!response.ok) {
      await response.body?.cancel() // free the socket
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const { stdout } = process
    const stream = Readable.fromWeb(response.body)

    const responseType = contentType.parse(response.headers.get('content-type')).type
    if (responseType === 'application/octet-stream') {
      if (stdout.isTTY) {
        throw new Error('binary data, pipe to a file!')
      }
      await fromCallback(pipeline, stream, stdout)
      return
    }

    assert.strictEqual(responseType, 'application/json')
    const lines = pumpify.obj(stream, split2())

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
      } else if (opts.raw && typeof result === 'string') {
        stdout.write(result)
      } else {
        stdout.write(inspect(result, { colors: true, depth: null }))
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

  const seq = async seq => {
    const j = callPath.length
    for (let i = 0, n = seq.length; i < n; ++i) {
      callPath[j] = i + 1
      await visit(seq[i])
    }
    callPath.pop()
  }

  const visit = node => {
    if (Array.isArray(node)) {
      return seq(node)
    }
    return call(node)
  }

  if (file !== '') {
    const data = fs.readFileSync(file, 'utf8')
    const ext = extname(file).slice(1).toLowerCase()
    const parse = FORMATS[ext]
    if (parse === undefined) {
      throw new Error(`unsupported file: ${file}`)
    }
    await visit(parse(data))
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

    await call({ method, params })
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
