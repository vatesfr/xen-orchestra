#!/usr/bin/env node

import { createReadStream, createWriteStream, readFileSync } from 'fs'
import { PassThrough, pipeline } from 'stream'
import { stat } from 'fs/promises'
import chalk from 'chalk'
import forEach from 'lodash/forEach.js'
import fromCallback from 'promise-toolbox/fromCallback'
import getKeys from 'lodash/keys.js'
import getopts from 'getopts'
import hrp from 'http-request-plus'
import humanFormat from 'human-format'
import identity from 'lodash/identity.js'
import isObject from 'lodash/isObject.js'
import micromatch from 'micromatch'
import pairs from 'lodash/toPairs.js'
import pick from 'lodash/pick.js'
import prettyMs from 'pretty-ms'
import progressStream from 'progress-stream'
import pw from 'pw'
import XoLib from 'xo-lib'

// -------------------------------------------------------------------

import * as config from './config.mjs'
import { inspect } from 'util'
import { rest } from './rest.mjs'

const Xo = XoLib.default

// ===================================================================

async function connect() {
  const { allowUnauthorized, server, token } = await config.load()
  if (server === undefined) {
    const errorMessage = 'Please use `xo-cli --register` to associate with an XO instance first.\n\n' + help()
    throw errorMessage
  }

  if (token === undefined) {
    throw new Error('no token available')
  }

  const xo = new Xo({ rejectUnauthorized: !allowUnauthorized, url: server })
  await xo.open()
  await xo.signIn({ token })
  return xo
}

async function parseRegisterArgs(args, tokenDescription, acceptToken = false) {
  const {
    allowUnauthorized,
    expiresIn,
    token,
    _: opts,
  } = getopts(args, {
    alias: {
      allowUnauthorized: 'au',
      token: 't',
    },
    boolean: ['allowUnauthorized'],
    stopEarly: true,
    string: ['expiresIn', 'token'],
  })

  const result = {
    allowUnauthorized,
    expiresIn: expiresIn || undefined,
    url: opts[0],
  }

  if (token !== '') {
    if (!acceptToken) {
      // eslint-disable-next-line no-throw-literal
      throw '`token` option is not accepted by this command'
    }
    result.token = token
  } else {
    const [
      ,
      email,
      password = await new Promise(function (resolve) {
        process.stdout.write('Password: ')
        pw(resolve)
      }),
    ] = opts
    result.token = await _createToken({ ...result, description: tokenDescription, email, password })
  }

  return result
}

async function _createToken({ allowUnauthorized, description, email, expiresIn, password, url }) {
  const xo = new Xo({ rejectUnauthorized: !allowUnauthorized, url })
  await xo.open()
  try {
    await xo.signIn({ email, password })
    console.warn('Successfully logged with', xo.user.email)

    return await xo.call('token.create', { description, expiresIn }).catch(error => {
      // if invalid parameter error, retry without description for backward compatibility
      if (error.code === 10) {
        return xo.call('token.create', { expiresIn })
      }
      throw error
    })
  } finally {
    await xo.close()
  }
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

// patch stdout and stderr to stop writing after an EPIPE error
//
// See https://github.com/vatesfr/xen-orchestra/issues/6680
;[process.stdout, process.stderr].forEach(stream => {
  let write = stream.write
  stream.on('error', function onError(error) {
    if (error.code === 'EPIPE') {
      stream.off('error', onError)
      write = noop
    }
  })
  stream.write = function () {
    return write.apply(this, arguments)
  }
})

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
    return `Usage:

  $name --register [--allowUnauthorized] [--expiresIn <duration>] <XO-Server URL> <username> [<password>]
  $name --register [--allowUnauthorized] [--expiresIn <duration>] --token <token> <XO-Server URL>
    Registers the XO instance to use.

    --allowUnauthorized, --au
      Accept invalid certificate (e.g. self-signed).

    --expiresIn <duration>
      Can be used to change the validity duration of the
      authorization token (default: one month).

    --token <token>
      An authentication token to use instead of username/password.

  $name --createToken <params>…
    Create an authentication token for XO API.

    <params>…
      Accept the same parameters as --register, see its usage.

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

  $name <command> [--json] [<name>=<value>]...
    Executes a command on the current XO instance.

    --json
      Prints the result in JSON format.

  $name rest del <resource>
    Delete the resource.

    Examples:
      $name rest del tasks/<task id>

  $name rest get <collection> [fields=<fields>] [filter=<filter>] [limit=<limit>]
    List objects in a REST API collection.

    <collection>
      Full path of the collection to list

    fields=<fields>
      When provided, returns a collection of objects containing the requested
      fields instead of the simply the objects' paths.

      The field names must be separated by commas.

    filter=<filter>
      List only objects that match the filter

      Syntax: https://xen-orchestra.com/docs/manage_infrastructure.html#filter-syntax

    limit=<limit>
      Maximum number of objects to list, e.g. \`limit=10\`

    Examples:
      $name rest get
      $name rest get tasks filter='status:pending'
      $name rest get vms fields=name_label,power_state

  $name rest get <object> [wait | wait=result]
    Show an object from the REST API.

    <object>
      Full path of the object to show

    wait
      If the object is a task, waits for it to be updated before returning.

    wait=result
      If the object is a task, waits for it to be finished before returning.

    Examples:
      $name rest get vms/<VM UUID>
      $name rest get tasks/<task id>/actions wait=result

  $name rest post <action> <name>=<value>...
    Execute an action.

    <action>
      Full path of the action to execute

    <name>=<value>...
      Paramaters to pass to the action

    Examples:
      $name rest post tasks/<task id>/actions/abort
      $name rest post vms/<VM UUID>/actions/snapshot name_label='My snapshot'

$name v$version`.replace(/<([^>]+)>|\$(\w+)/g, function (_, arg, key) {
      if (arg) {
        return '<' + chalk.yellow(arg) + '>'
      }

      if (key === 'name') {
        return chalk.bold(pkg[key])
      }

      return pkg[key]
    })
  })(JSON.parse(readFileSync(new URL('package.json', import.meta.url))))
)

// -------------------------------------------------------------------

const COMMANDS = { __proto__: null }

async function main(args) {
  if (!args || !args.length || args[0] === '-h') {
    return help()
  }

  const fnName = args[0].replace(/^--|-\w/g, function (match) {
    if (match === '--') {
      return ''
    }

    return match[1].toUpperCase()
  })

  try {
    if (fnName in COMMANDS) {
      return await COMMANDS[fnName](args.slice(1))
    }

    return await COMMANDS.call(args).catch(error => {
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
  } catch (error) {
    // `promise-toolbox/fromEvent` uses `addEventListener` by default wich makes
    // `ws/WebSocket` (used by `xo-lib`) emit DOM `Event` objects which are not
    // correctly displayed by `exec-promise`.
    //
    // Extracts the original error for a better display.
    throw typeof error === 'object' && 'error' in error ? error.error : error
  }
}

// -------------------------------------------------------------------

COMMANDS.rest = rest

// -------------------------------------------------------------------

COMMANDS.help = help

async function createToken(args) {
  const { token } = await parseRegisterArgs(args, 'xo-cli --createToken')

  console.warn('Authentication token created')
  console.warn()
  console.log(token)
}
COMMANDS.createToken = createToken

async function register(args) {
  const opts = await parseRegisterArgs(args, 'xo-cli --register', true)
  await config.set({
    allowUnauthorized: opts.allowUnauthorized,
    server: opts.url,
    token: opts.token,
  })
}
COMMANDS.register = register

function unregister() {
  return config.unset(['server', 'token'])
}
COMMANDS.unregister = unregister

async function listCommands(args) {
  const xo = await connect()
  try {
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
        const { optional = Object.hasOwn(info, 'default') } = info
        if (optional) {
          str.push('[')
        }

        const type = info.type
        str.push(name, '=<', type == null ? 'unknown type' : Array.isArray(type) ? type.join('|') : type, '>')

        if (optional) {
          str.push(']')
        }
      })
      str.push('\n')
      if (info.description) {
        str.push('  ', info.description, '\n')
      }
    })
    return str.join('')
  } finally {
    await xo.close()
  }
}
COMMANDS.listCommands = listCommands

async function listObjects(args) {
  const properties = getKeys(extractFlags(args))
  const filterProperties = properties.length
    ? function (object) {
        return pick(object, properties)
      }
    : identity

  const filter = args.length ? parseParameters(args) : undefined

  const xo = await connect()
  try {
    const objects = await xo.call('xo.getAllObjects', { filter })

    const stdout = process.stdout
    stdout.write('[\n')
    const keys = Object.keys(objects)
    for (let i = 0, n = keys.length; i < n; ) {
      stdout.write(JSON.stringify(filterProperties(objects[keys[i]]), null, 2))
      stdout.write(++i < n ? ',\n' : '\n')
    }
    stdout.write(']\n')
  } finally {
    await xo.close()
  }
}
COMMANDS.listObjects = listObjects

function ensurePathParam(method, value) {
  if (typeof value !== 'string') {
    const error = method + ' requires the @ parameter to be a path (e.g. @=/tmp/config.json)'
    throw error
  }
}

async function call(args) {
  const jsonOutput = args[1] === '--json'
  if (jsonOutput) {
    args.splice(1, 1)
  }

  if (!args.length) {
    throw new Error('missing command name')
  }

  const method = args.shift()
  const params = parseParameters(args)

  const file = params['@']
  delete params['@']

  const xo = await connect()
  try {
    // FIXME: do not use private properties.
    const baseUrl = xo._url.replace(/^ws/, 'http')
    const httpOptions = {
      rejectUnauthorized: !(await config.load()).allowUnauthorized,
    }

    const result = await xo.call(method, params)
    let keys, key, url
    if (isObject(result) && (keys = getKeys(result)).length === 1) {
      key = keys[0]

      if (key === '$getFrom') {
        ensurePathParam(method, file)
        url = new URL(result[key], baseUrl)
        const output = createOutputStream(file)
        const response = await hrp(url, httpOptions)

        const progress = progressStream(
          {
            length: response.headers['content-length'],
            time: 1e3,
          },
          printProgress
        )

        return fromCallback(pipeline, response, progress, output)
      }

      if (key === '$sendTo') {
        ensurePathParam(method, file)
        url = new URL(result[key], baseUrl)

        const length = file === '-' ? undefined : (await stat(file)).size
        const input = pipeline(
          file === '-' ? process.stdin : createReadStream(file),
          progressStream(
            {
              length,
              time: 1e3,
            },
            printProgress
          ),
          noop
        )

        const response = await hrp(url, {
          ...httpOptions,
          body: input,
          headers: length && {
            'content-length': length,
          },
          method: 'POST',
        })
        return response.text()
      }
    }

    return jsonOutput ? JSON.stringify(result, null, 2) : result
  } finally {
    await xo.close()
  }
}
COMMANDS.call = call

// ===================================================================

// don't call process.exit() to avoid truncated output
main(process.argv.slice(2)).then(
  result => {
    if (result !== undefined) {
      if (Number.isInteger(result)) {
        process.exitCode = result
      } else {
        const { stdout } = process
        stdout.write(
          typeof result === 'string'
            ? result
            : inspect(result, {
                colors: Boolean(stdout.isTTY),
                depth: null,
                sorted: true,
              })
        )
        stdout.write('\n')
      }
    }
  },
  error => {
    const { stderr } = process
    stderr.write(chalk.bold.red('✖'))
    stderr.write(' ')
    stderr.write(
      typeof error === 'string'
        ? error
        : inspect(error, {
            colors: Boolean(stderr.isTTY),
            depth: null,
            sorted: true,
          })
    )
    stderr.write('\n')
    process.exitCode = 1
  }
)
