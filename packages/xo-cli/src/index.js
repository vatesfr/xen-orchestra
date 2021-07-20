#!/usr/bin/env node

'use strict'

const Bluebird = require('bluebird')
Bluebird.longStackTraces()

const createReadStream = require('fs').createReadStream
const createWriteStream = require('fs').createWriteStream
const resolveUrl = require('url').resolve
const stat = require('fs-extra').stat

const chalk = require('chalk')
const forEach = require('lodash/forEach')
const fromCallback = require('promise-toolbox/fromCallback')
const getKeys = require('lodash/keys')
const hrp = require('http-request-plus').default
const humanFormat = require('human-format')
const identity = require('lodash/identity')
const isObject = require('lodash/isObject')
const micromatch = require('micromatch')
const pairs = require('lodash/toPairs')
const pick = require('lodash/pick')
const pump = require('pump')
const prettyMs = require('pretty-ms')
const progressStream = require('progress-stream')
const pw = require('pw')
const Xo = require('xo-lib').default
const { PassThrough, pipeline } = require('stream')

// -------------------------------------------------------------------

const config = require('./config')

// ===================================================================

async function connect() {
  const { server, token } = await config.load()
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

function createOutputStream(path) {
  if (path !== undefined && path !== '-') {
    return createWriteStream(path)
  }

  // introduce a through stream because stdout is not a normal stream!
  const stream = new PassThrough()
  stream.pipe(process.stdout)
  return stream
}

const FLAG_RE = /^--([^=]+)(?:=([^]*))?$/
function extractFlags(args) {
  const flags = {}

  let i = 0
  const n = args.length
  let matches
  while (i < n && (matches = args[i].match(FLAG_RE))) {
    const value = matches[2]

    flags[matches[1]] = value === undefined ? true : value
    ++i
  }
  args.splice(0, i)

  return flags
}

const noop = Function.prototype

const PARAM_RE = /^([^=]+)=([^]*)$/
function parseParameters(args) {
  const params = {}
  forEach(args, function (arg) {
    let matches
    if (!(matches = arg.match(PARAM_RE))) {
      throw new Error('invalid arg: ' + arg)
    }
    const name = matches[1]
    let value = matches[2]

    if (value.startsWith('json:')) {
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

function wrap(val) {
  return function wrappedValue() {
    return val
  }
}

// ===================================================================

const help = wrap(
  (function (pkg) {
    return require('strip-indent')(
      `
    Usage:

      $name --register [--expiresIn duration] <XO-Server URL> <username> [<password>]
        Registers the XO instance to use.

        --expiresIn duration
          Can be used to change the validity duration of the
          authorization token (default: one month).

      $name --unregister
        Remove stored credentials.

      $name --list-commands [--json] [<pattern>]...
        Returns the list of available commands on the current XO instance.

        The patterns can be used to filter on command names.

      $name --list-objects [--<property>]… [<property>=<value>]...
        Returns a list of XO objects.

        --<property>
          Restricts displayed properties to those listed.

        <property>=<value>
          Restricted displayed objects to those matching the patterns.

      $name <command> [<name>=<value>]...
        Executes a command on the current XO instance.

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
  })(require('../package'))
)

// -------------------------------------------------------------------

function main(args) {
  if (!args || !args.length || args[0] === '-h') {
    return help()
  }

  const fnName = args[0].replace(/^--|-\w/g, function (match) {
    if (match === '--') {
      return ''
    }

    return match[1].toUpperCase()
  })
  if (fnName in exports) {
    return exports[fnName](args.slice(1))
  }

  return exports.call(args).catch(error => {
    if (!(error != null && error.code === 10 && 'errors' in error.data)) {
      throw error
    }

    const lines = [error.message]
    const { errors } = error.data
    errors.forEach(error => {
      lines.push(`  property ${error.property}: ${error.message}`)
    })
    throw lines.join('\n')
  })
}
exports = module.exports = main

// -------------------------------------------------------------------

exports.help = help

async function register(args) {
  let expiresIn
  if (args[0] === '--expiresIn') {
    expiresIn = args[1]
    args = args.slice(2)
  }

  const [
    url,
    email,
    password = await new Promise(function (resolve) {
      process.stdout.write('Password: ')
      pw(resolve)
    }),
  ] = args

  const xo = new Xo({ url })
  await xo.open()
  await xo.signIn({ email, password })
  console.log('Successfully logged with', xo.user.email)

  await config.set({
    server: url,
    token: await xo.call('token.create', { expiresIn }),
  })
}
exports.register = register

function unregister() {
  return config.unset(['server', 'token'])
}
exports.unregister = unregister

async function listCommands(args) {
  const xo = await connect()
  let methods = await xo.call('system.getMethodsInfo')

  let json = false
  const patterns = []
  forEach(args, function (arg) {
    if (arg === '--json') {
      json = true
    } else {
      patterns.push(arg)
    }
  })

  if (patterns.length) {
    methods = pick(methods, micromatch(Object.keys(methods), patterns))
  }

  if (json) {
    return methods
  }

  methods = pairs(methods)
  methods.sort(function (a, b) {
    a = a[0]
    b = b[0]
    if (a < b) {
      return -1
    }
    return +(a > b)
  })

  const str = []
  forEach(methods, function (method) {
    const name = method[0]
    const info = method[1]
    str.push(chalk.bold.blue(name))
    forEach(info.params || [], function (info, name) {
      str.push(' ')
      if (info.optional) {
        str.push('[')
      }

      const type = info.type
      str.push(name, '=<', type == null ? 'unknown type' : Array.isArray(type) ? type.join('|') : type, '>')

      if (info.optional) {
        str.push(']')
      }
    })
    str.push('\n')
    if (info.description) {
      str.push('  ', info.description, '\n')
    }
  })
  return str.join('')
}
exports.listCommands = listCommands

async function listObjects(args) {
  const properties = getKeys(extractFlags(args))
  const filterProperties = properties.length
    ? function (object) {
        return pick(object, properties)
      }
    : identity

  const filter = args.length ? parseParameters(args) : undefined

  const xo = await connect()
  const objects = await xo.call('xo.getAllObjects', { filter })

  const stdout = process.stdout
  stdout.write('[\n')
  const keys = Object.keys(objects)
  for (let i = 0, n = keys.length; i < n; ) {
    stdout.write(JSON.stringify(filterProperties(objects[keys[i]]), null, 2))
    stdout.write(++i < n ? ',\n' : '\n')
  }
  stdout.write(']\n')
}
exports.listObjects = listObjects

function ensurePathParam(method, value) {
  if (typeof value !== 'string') {
    const error = method + ' requires the @ parameter to be a path (e.g. @=/tmp/config.json)'
    throw error
  }
}

async function call(args) {
  if (!args.length) {
    throw new Error('missing command name')
  }

  const method = args.shift()
  const params = parseParameters(args)

  const file = params['@']
  delete params['@']

  const xo = await connect()

  // FIXME: do not use private properties.
  const baseUrl = xo._url.replace(/^ws/, 'http')

  const result = await xo.call(method, params)
  let keys, key, url
  if (isObject(result) && (keys = getKeys(result)).length === 1) {
    key = keys[0]

    if (key === '$getFrom') {
      ensurePathParam(method, file)
      url = resolveUrl(baseUrl, result[key])
      const output = createOutputStream(file)
      const response = await hrp(url)

      const progress = progressStream(
        {
          length: response.headers['content-length'],
          time: 1e3,
        },
        printProgress
      )

      return fromCallback(pump, response, progress, output)
    }

    if (key === '$sendTo') {
      ensurePathParam(method, file)
      url = resolveUrl(baseUrl, result[key])

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

      return hrp
        .post(url, {
          body: input,
          headers: {
            'content-length': length,
          },
        })
        .readAll('utf-8')
    }
  }

  return result
}
exports.call = call

// ===================================================================

if (!module.parent) {
  require('exec-promise')(exports)
}
