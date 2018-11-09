import chalk from 'chalk'
import execPromise from 'exec-promise'
import { createReadStream } from 'fs'
import { stat } from 'fs-promise'
import getStream from 'get-stream'
import hrp from 'http-request-plus'
import humanFormat from 'human-format'
import forEach from 'lodash/forEach'
import isObject from 'lodash/isObject'
import getKeys from 'lodash/keys'
import startsWith from 'lodash/startsWith'
import nicePipe from 'nice-pipe'
import prettyMs from 'pretty-ms'
import progressStream from 'progress-stream'
import pw from 'pw'
import stripIndent from 'strip-indent'
import { resolve as resolveUrl } from 'url'
import Xo from 'xo-lib'
import { parseOVAFile } from 'xo-ova'

import pkg from '../package'
import {
  load as loadConfig,
  set as setConfig,
  unset as unsetConfig,
} from './config'

function help () {
  return stripIndent(
    `
    Usage:

      $name --register [--expiresIn duration] <XO-Server URL> <username> [<password>]
        Registers the XO instance to use.

        --expiresIn duration
          Can be used to change the validity duration of the
          authorization token (default: one month).

      $name --unregister
        Remove stored credentials.
        
      $name --inspect <file>
        Displays the data that would be imported from the ova.


    $name v$version
  `
  ).replace(/<([^>]+)>|\$(\w+)/g, function (_, arg, key) {
    if (arg) {
      return '<' + chalk.yellow(arg) + '>'
    }

    if (key === 'name') {
      return chalk.bold(pkg[key])
    }

    return pkg[key]
  })
}

async function connect () {
  const { server, token } = await loadConfig()
  if (server === undefined) {
    throw new Error('no server to connect to!')
  }

  if (token === undefined) {
    throw new Error('no token available')
  }

  const xo = new Xo({ url: server })
  await xo.open()
  await xo.signIn({ token })
  return xo
}

export function unregister () {
  return unsetConfig(['server', 'token'])
}

export async function register (args) {
  let expiresIn
  if (args[0] === '--expiresIn') {
    expiresIn = args[1]
    args = args.slice(2)
  }

  const [
    url,
    email,
    password = await new Promise(resolve => {
      process.stdout.write('Password: ')
      pw(resolve)
    }),
  ] = args

  const xo = new Xo({ url })
  await xo.open()
  await xo.signIn({ email, password })
  console.log('Successfully logged with', xo.user.email)

  await setConfig({
    server: url,
    token: await xo.call('token.create', { expiresIn }),
  })
}

function nodeStringDecoder (buffer, encoder) {
  return Buffer.from(buffer).toString(encoder)
}

export async function inspect (args) {
  const file = args[0]
  const data = await parseOVAFile(
    new NodeParsableFile(file, (await stat(file)).size),
    nodeStringDecoder,
    true
  )
  console.log('data', data)
}

const PARAM_RE = /^([^=]+)=([^]*)$/

export class NodeParsableFile {
  constructor (fileName, fileLength = Infinity) {
    this._fileName = fileName
    this._start = 0
    this._end = fileLength
  }

  slice (start, end) {
    const newFile = new NodeParsableFile(this._fileName)
    newFile._start = start < 0 ? this._end + start : this._start + start
    newFile._end = end < 0 ? this._end + end : this._start + end
    return newFile
  }

  async read () {
    const result = await getStream.buffer(
      createReadStream(this._fileName, {
        start: this._start,
        end: this._end - 1,
      })
    )
    // crazy stuff to get a browser-compatible ArrayBuffer from a node buffer
    // https://stackoverflow.com/a/31394257/72637
    return result.buffer.slice(
      result.byteOffset,
      result.byteOffset + result.byteLength
    )
  }
}

function parseParameters (args) {
  const params = {}
  forEach(args, function (arg) {
    let matches
    if (!(matches = arg.match(PARAM_RE))) {
      throw new Error('invalid arg: ' + arg)
    }
    const name = matches[1]
    let value = matches[2]

    if (startsWith(value, 'json:')) {
      value = JSON.parse(value.slice(5))
    }

    if (name === '@') {
      params['@'] = value
      return
    }

    if (value === 'true') {
      value = true
    } else if (value === 'false') {
      value = false
    }

    params[name] = value
  })

  return params
}

function ensurePathParam (method, value) {
  if (typeof value !== 'string') {
    /* eslint no-throw-literal: "off" */
    throw method +
      ' requires the @ parameter to be a path (e.g. @=/tmp/config.json)'
  }
}

const humanFormatOpts = {
  unit: 'B',
  scale: 'binary',
}

function printProgress (progress) {
  if (progress.length) {
    console.warn(
      '%s% of %s @ %s/s - ETA %s',
      Math.round(progress.percentage),
      humanFormat(progress.length, humanFormatOpts),
      humanFormat(progress.speed, humanFormatOpts),
      prettyMs(progress.eta * 1e3)
    )
  } else {
    console.warn(
      '%s @ %s/s',
      humanFormat(progress.transferred, humanFormatOpts),
      humanFormat(progress.speed, humanFormatOpts)
    )
  }
}

async function call (args) {
  if (!args.length) {
    throw new Error('missing command name')
  }

  const method = args.shift()
  const params = parseParameters(args)

  const file = params['@']
  delete params['@']

  const data = await parseOVAFile(
    new NodeParsableFile(file, (await stat(file)).size),
    nodeStringDecoder
  )
  const xo = await connect()
  const getXoObject = async filter =>
    Object.values(await xo.call('xo.getAllObjects', { filter }))[0]
  const sr = await getXoObject({ id: params.sr })
  const pool = await getXoObject({ id: sr.$poolId })
  const master = await getXoObject({ id: pool.master })
  const pif = await getXoObject({
    type: 'PIF',
    management: true,
    $host: master.id,
  })
  data.networks = data.networks.map(() => pif.$network)
  data.disks = Object.values(data.disks)
  console.log('data', data)
  params.data = data
  params.type = 'ova'

  // FIXME: do not use private properties.
  const baseUrl = xo._url.replace(/^ws/, 'http')

  const result = await xo.call(method, params)
  let keys, key, url
  if (isObject(result) && (keys = getKeys(result)).length === 1) {
    key = keys[0]

    if (key === '$sendTo') {
      ensurePathParam(method, file)
      url = resolveUrl(baseUrl, result[key])

      const { size: length } = await stat(file)
      const input = nicePipe([
        createReadStream(file),
        progressStream(
          {
            length,
            time: 1e3,
          },
          printProgress
        ),
      ])

      try {
        return await hrp
          .post(url, {
            body: input,
            headers: {
              'content-length': length,
            },
          })
          .readAll('utf-8')
      } catch (e) {
        console.log('ERROR', e)
        console.log('ERROR content', await e.response.readAll('utf-8'))
        throw e
      }
    }
  }
}

export default async function main (args) {
  if (!args || !args.length || args[0] === '-h') {
    return help()
  }
  const fnName = args[0].replace(
    /^--|-\w/g,
    match => (match === '--' ? '' : match[1].toUpperCase())
  )
  if (fnName in exports) {
    return exports[fnName](args.slice(1))
  }
  return call(args)
}

if (!module.parent) {
  execPromise(main)
}
