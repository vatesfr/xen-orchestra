#!/usr/bin/env node

/* eslint no-console: "off" */

import chalk from 'chalk'
import execPromise from 'exec-promise'
import FormData from 'form-data'
import { createReadStream } from 'fs'
import { stat } from 'fs-extra'
import getStream from 'get-stream'
import has from 'lodash/has'
import hrp from 'http-request-plus'
import humanFormat from 'human-format'
import isObject from 'lodash/isObject'
import getKeys from 'lodash/keys'
import set from 'lodash/set'
import startsWith from 'lodash/startsWith'
import prettyMs from 'pretty-ms'
import progressStream from 'progress-stream'
import pw from 'pw'
import { URL } from 'url'
import Xo from 'xo-lib'
import { parseOVAFile } from 'xo-vmdk-to-vhd'
import { pipeline } from 'stream'

import pkg from '../package'
import { load as loadConfig, set as setConfig, unset as unsetConfig } from './config'

const noop = Function.prototype

function help() {
  return `Usage:

  $name --register [--expiresIn duration] <XO-Server URL> <username> [<password>]
    Registers the XO instance to use.

    --expiresIn duration
      Can be used to change the validity duration of the
      authorization token (default: one month).

  $name --unregister
    Remove stored credentials.

  $name --inspect <file>
    Displays the data that would be imported from the ova.

  $name --upload <file> <sr> [--override <key>=<value> [<key>=<value>]+]
    Actually imports the VM contained in <file> to the Storage Repository <sr>.
    Some parameters can be overridden from the file, consult --inspect to get the list.
    Note: --override has to come last. By default arguments are string, prefix them with <json:> to type
    them, ex. " --override nameLabel='new VM'  memory=json:67108864 disks.vmdisk1.capacity=json:134217728"

$name v$version
`.replace(/<([^>]+)>|\$(\w+)/g, function (_, arg, key) {
    if (arg) {
      return '<' + chalk.yellow(arg) + '>'
    }

    if (key === 'name') {
      return chalk.bold(pkg[key])
    }

    return pkg[key]
  })
}

async function connect() {
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

export function unregister() {
  return unsetConfig(['server', 'token'])
}

export async function register(args) {
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

function nodeStringDecoder(buffer, encoder) {
  return Buffer.from(buffer).toString(encoder)
}

export async function inspect(args) {
  const file = args[0]
  const data = await parseOVAFile(new NodeParsableFile(file, (await stat(file)).size), nodeStringDecoder, true)
  console.log('file metadata:', data)
}

function parseOverride(args) {
  const flag = args.shift()
  if (flag !== '--override') {
    throw new Error('Third argument has to be --override')
  }

  if (args.length === 0) {
    throw new Error('Missing actual override')
  }
  const overrides = {}
  for (const definition of args) {
    const index = definition.indexOf('=')
    const key = definition.slice(0, index)
    let value = definition.slice(index + 1)
    if (startsWith(value, 'json:')) {
      value = JSON.parse(value.slice(5))
    }
    overrides[key] = value
  }
  return overrides
}

export async function upload(args) {
  const file = args.shift()
  const srId = args.shift()
  let overrides = {}
  if (args.length > 1) {
    overrides = parseOverride(args)
  }

  const data = await parseOVAFile(new NodeParsableFile(file, (await stat(file)).size), nodeStringDecoder)
  const params = { sr: srId }
  const xo = await connect()
  const getXoObject = async filter => Object.values(await xo.call('xo.getAllObjects', { filter }))[0]
  const sr = await getXoObject({ id: srId })
  const pool = await getXoObject({ id: sr.$poolId })
  const master = await getXoObject({ id: pool.master })
  const pif = await getXoObject({
    type: 'PIF',
    management: true,
    $host: master.id,
  })
  data.networks = data.networks.map(() => pif.$network)
  console.log('data', data)
  const overridesKeys = Object.keys(overrides)
  const missingKeys = overridesKeys.filter(k => !has(data, k))
  if (missingKeys.length) {
    // eslint-disable-next-line no-throw-literal
    throw `those override keys don't exist in the metadata: ${missingKeys}`
  }
  for (const key of overridesKeys) {
    set(data, key, overrides[key])
  }
  data.disks = Object.values(data.disks)
  params.data = data
  params.type = 'ova'
  const method = 'vm.import'

  // FIXME: do not use private properties.
  const baseUrl = xo._url.replace(/^ws/, 'http')

  const result = await xo.call(method, params).catch(error => {
    if (!(error != null && error.code === 10 && 'errors' in error.data)) {
      throw error
    }

    const lines = [error.message]
    const { errors } = error.data
    errors.forEach(error => {
      let { instancePath } = error
      instancePath = instancePath.length === 0 ? '@' : '@.' + instancePath
      lines.push(`  property ${instancePath}: ${error.message}`)
    })
    throw lines.join('\n')
  })
  let keys, key, url
  if (isObject(result) && (keys = getKeys(result)).length === 1) {
    key = keys[0]
    if (key === '$sendTo') {
      const formData = new FormData()
      if (data.tables !== undefined) {
        for (const k in data.tables) {
          const tables = await data.tables[k]
          delete data.tables[k]
          for (const l in tables) {
            formData.append(l, Buffer.from(tables[l]), k)
          }
        }
      }
      if (typeof file !== 'string') {
        // eslint-disable-next-line no-throw-literal
        throw 'file parameter should be a path'
      }
      url = new URL(result[key], baseUrl)

      const { size: length } = await stat(file)
      const input = pipeline(
        createReadStream(file),
        progressStream(
          {
            length,
            time: 1e3,
          },
          printProgress
        ),
        noop
      )
      formData.append('file', input, { filename: 'file', knownLength: length })
      try {
        const response = await hrp(url.toString(), { body: formData, headers: formData.getHeaders(), method: 'POST' })
        return await response.text()
      } catch (e) {
        console.log('ERROR', e)
        const { response } = e
        if (response !== undefined) {
          console.log('ERROR content', await response.text())
        }

        throw e
      }
    }
  }
}

export class NodeParsableFile {
  constructor(fileName, fileLength = Infinity) {
    this._fileName = fileName
    this._start = 0
    this._end = fileLength
  }

  slice(start, end) {
    const newFile = new NodeParsableFile(this._fileName)
    newFile._start = start < 0 ? this._end + start : this._start + start
    newFile._end = end < 0 ? this._end + end : this._start + end
    return newFile
  }

  async read() {
    const result = await getStream.buffer(
      createReadStream(this._fileName, {
        start: this._start,
        end: this._end - 1,
      })
    )
    // crazy stuff to get a browser-compatible ArrayBuffer from a node buffer
    // https://stackoverflow.com/a/31394257/72637
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength)
  }
}

const humanFormatOpts = {
  unit: 'B',
  scale: 'binary',
}

function printProgress(progress) {
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

export default async function main(args) {
  if (!args || !args.length || args[0] === '-h' || args[0] === '--help') {
    return help()
  }
  const fnName = args[0].replace(/^--|-\w/g, match => (match === '--' ? '' : match[1].toUpperCase()))
  if (fnName in exports) {
    return exports[fnName](args.slice(1))
  }
  return help()
}

if (!module.parent) {
  execPromise(main)
}
