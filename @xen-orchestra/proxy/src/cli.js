#!/usr/bin/env node

import getopts from 'getopts'
import hrp from 'http-request-plus'
import { format, parse } from 'json-rpc-protocol'
import { load as loadConfig } from 'app-conf'

const parseValue = value =>
  value.startsWith('json:') ? JSON.parse(value.slice(5)) : value

async function main(argv) {
  const config = await loadConfig('xo-proxy', {
    appDir: `${__dirname}/..`,
    ignoreUnknownFormats: true,
  })

  const { hostname = 'localhost', port } = config.http.listen.https

  const { _: args, help, host, token } = getopts(argv, {
    alias: { help: 'h' },
    boolean: ['help'],
    default: {
      host: `${hostname}:${port}`,
      token: config.authenticationToken,
    },
    stopEarly: true,
    string: ['host', 'token'],
  })

  if (help || args.length === 0) {
    return console.log(
      '%s',
      `
Usage:

  xo-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.
`
    )
  }

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

  const lines = (
    await hrp
      .post({
        body: format.request(0, method, params),
        headers: {
          'content-type': 'application/json',
          cookie: `authenticationToken=${token}`,
        },
        host,
        pathname: '/api/v1',
        protocol: 'https:',
        rejectUnauthorized: false,
      })
      .readAll('utf8')
  )
    .split(/\r?\n/)
    .filter(_ => _.length !== 0)
  try {
    const result = await parse.result(lines[0])
    if (
      result !== null &&
      typeof result === 'object' &&
      Object.keys(result).length === 1 &&
      result.$responseType === 'ndjson'
    ) {
      for (let i = 1, n = lines.length; i < n; ++i) {
        console.log(JSON.parse(lines[i]))
      }
    } else {
      console.log(result)
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
main(process.argv.slice(2)).then(
  () => {
    process.exit(0)
  },
  error => {
    console.error('exception in main:', error)

    process.exit(1)
  }
)
