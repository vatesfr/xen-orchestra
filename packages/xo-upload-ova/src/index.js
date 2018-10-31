import chalk from 'chalk'
import execPromise from 'exec-promise'
import pw from 'pw'
import stripIndent from 'strip-indent'
import Xo from 'xo-lib'

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
    password = await new Promise(function (resolve) {
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
  await connect()
}

if (!module.parent) {
  execPromise(main)
}
