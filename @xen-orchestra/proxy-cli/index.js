#!/usr/bin/env node

'use strict'

const assert = require('assert')
const colors = require('ansi-colors')
const contentType = require('content-type')
const CSON = require('cson-parser')
const fromCallback = require('promise-toolbox/fromCallback')
const fs = require('fs')
const getopts = require('getopts')
const hrp = require('http-request-plus')
const split2 = require('split2')
const pumpify = require('pumpify')
const { extname } = require('path')
const { format, parse } = require('json-rpc-protocol')
const { inspect } = require('util')
const { load: loadConfig } = require('app-conf')
const { pipeline } = require('stream')
const { readChunk } = require('@vates/read-chunk')

const pkg = require('./package.json')

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

  const { hostname = 'localhost', port } = config?.http?.listen?.https ?? {}

  const {
    _: args,
    file,
    help,
    host,
    raw,
    token,
  } = getopts(argv, {
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
    Read a CSON or JSON file containing an object with \`method\` and \`params\`
    properties and call the API method.

    The file can also contain an array containing multiple calls, which will be
    run in sequence.

${pkg.name} v${pkg.version}`
    )
  }

  // sequence path of the current call
  const callPath = []

  const baseRequest = {
    headers: {
      'content-type': 'application/json',
      cookie: `authenticationToken=${token}`,
    },
    pathname: '/api/v1',
    protocol: 'https:',
    rejectUnauthorized: false,
  }
  if (host !== '') {
    baseRequest.host = host
  } else {
    baseRequest.hostname = hostname
    baseRequest.port = port
  }
  const call = async ({ method, params }) => {
    if (callPath.length !== 0) {
      process.stderr.write(`\n${colors.bold(`--- call #${callPath.join('.')}`)} ---\n\n`)
    }

    const response = await hrp.post(baseRequest, {
      body: format.request(0, method, params),
    })

    const { stdout } = process

    const responseType = contentType.parse(response).type
    if (responseType === 'application/octet-stream') {
      if (stdout.isTTY) {
        throw new Error('binary data, pipe to a file!')
      }
      await fromCallback(pipeline, response, stdout)
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
