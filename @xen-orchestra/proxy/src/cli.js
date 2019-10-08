#!/usr/bin/env node

import hrp from 'http-request-plus'
import { format, parse } from 'json-rpc-protocol'

const parseValue = value =>
  value.startsWith('json:') ? JSON.parse(value.slice(5)) : value

const required = param => {
  throw new Error(`missing ${param} parameter`)
}

async function main(args) {
  if (args.length === 0 || args.includes('-h')) {
    return console.log(
      '%s',
      `
Usage: xo-proxy-cli <XO proxy URL> <authentication token> <method> [<param>=<value>]...
`
    )
  }

  const [
    url = required('url'),
    authenticationToken = required('authentication token'),
    method = required('method'),
  ] = args

  const params = {}
  for (let i = 3, n = args.length; i < n; ++i) {
    const param = args[i]
    const j = param.indexOf('=')
    if (j === -1) {
      throw new Error(`invalid param format: ${param}`)
    }
    params[param.slice(0, j)] = parseValue(param.slice(j + 1))
  }

  const lines = (await hrp
    .post(url, {
      body: format.request(0, method, params),
      headers: {
        'content-type': 'application/json',
        cookie: `authenticationToken=${authenticationToken}`,
      },
      pathname: '/api/v1',
    })
    .readAll('utf8'))
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
