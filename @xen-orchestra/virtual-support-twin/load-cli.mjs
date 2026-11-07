#!/usr/bin/env node

import * as openpgp from 'openpgp'
import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { createReadStream } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { pipeline } from 'node:stream/promises'

import { connectXo } from './xo-api.mjs'
import { createFakeXapi } from './fake-xapi.mjs'
import { neutralizeConfig } from './config.mjs'

const USAGE = `
Usage: load-cli.mjs <bundle.ndjson.gz.pgp> [options]

  Loads a support bundle in an EMPTY dedicated XO (no servers, no tasks), then serves its XAPI objects
  until interrupted. Run it on the XO machine, as the user of xo-server, to access its database.

  --xo         URL of the XO (default: http://localhost)
  --xo-server  directory of xo-server (default: the one of this repository)
  --datadir    datadir of xo-server (default: /var/lib/xo-server/data)
  --host       address on which the fake XAPIs listen, must be reachable by the XO (default: 127.0.0.1)

  Environment:
    XO_SUPPORT_BUNDLE_PASSPHRASE  passphrase of the bundle
    XO_USER, XO_PASSWORD          admin of the XO (default: admin@admin.net / admin, as created by an empty XO)
`

// the `tasks` store holds XO tasks, the `logs` store holds legacy backup logs
const TASK_STORES = ['tasks', 'logs']

async function* readBundleLines(path, passphrase) {
  const { data } = await openpgp.decrypt({
    message: await openpgp.readMessage({ binaryMessage: createReadStream(path) }),
    passwords: passphrase,
    format: 'binary',
  })
  const gunzip = createGunzip()
  pipeline(data, gunzip).catch(error => gunzip.destroy(error))
  for await (const line of createInterface({ input: gunzip, crlfDelay: Infinity })) {
    if (line !== '') {
      yield JSON.parse(line)
    }
  }
}

/**
 * opens the task stores like xo-server does (same modules, same layout), shared with a running xo-server
 */
function openTaskStores(xoServerDir, datadir) {
  const require = createRequire(join(xoServerDir, 'package.json'))
  const db = require('level-party')(join(datadir, 'leveldb'))
  const sublevel = require('subleveldown')
  return {
    stores: Object.fromEntries(TASK_STORES.map(name => [name, sublevel(db, name, { valueEncoding: 'json' })])),
    close: () => db.close(),
  }
}

async function isStoreEmpty(store) {
  const keys = store.createKeyStream({ limit: 1 })[Symbol.asyncIterator]()
  const { done } = await keys.next()
  await keys.return()
  return done
}

async function main(args) {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      datadir: { type: 'string', default: '/var/lib/xo-server/data' },
      help: { type: 'boolean', short: 'h' },
      host: { type: 'string', default: '127.0.0.1' },
      xo: { type: 'string', default: 'http://localhost' },
      'xo-server': { type: 'string', default: fileURLToPath(new URL('../../packages/xo-server', import.meta.url)) },
    },
  })
  const {
    XO_SUPPORT_BUNDLE_PASSPHRASE: passphrase,
    XO_USER: email = 'admin@admin.net',
    XO_PASSWORD: password = 'admin',
  } = process.env
  const [bundlePath] = positionals
  if (values.help || bundlePath === undefined) {
    process.stderr.write(USAGE)
    return
  }
  if (passphrase === undefined) {
    throw new Error('XO_SUPPORT_BUNDLE_PASSPHRASE must be set')
  }

  // first pass: XAPI objects are kept in memory to be served, like XO does
  const recordsByTypeByPool = new Map()
  let manifest
  for await (const line of readBundleLines(bundlePath, passphrase)) {
    if (line.kind === 'xapi') {
      let recordsByType = recordsByTypeByPool.get(line.poolId)
      if (recordsByType === undefined) {
        recordsByTypeByPool.set(line.poolId, (recordsByType = {}))
      }
      const record =
        // XO falls back to the pool members addresses when the XAPI is unreachable, never reach the original hosts
        line.type.toLowerCase() === 'host' ? { ...line.record, address: values.host } : line.record
      ;(recordsByType[line.type] ??= {})[line.ref] = record
    } else if (line.kind === 'manifest') {
      manifest = line
    }
  }
  if (manifest === undefined) {
    throw new Error('the bundle has no manifest, it is incomplete')
  }

  const xo = await connectXo(values.xo)
  const taskStores = openTaskStores(values['xo-server'], values.datadir)
  const fakeXapis = []
  const closeFakeXapis = () => Promise.all(fakeXapis.map(fakeXapi => fakeXapi.close()))
  try {
    const currentUser = await xo.call('session.signIn', { email, password })

    const xoServerVersion = await xo.call('system.getServerVersion')
    if (manifest.xoServerVersion !== undefined && manifest.xoServerVersion !== xoServerVersion) {
      console.warn(
        'the bundle has been exported by xo-server %s, this XO runs %s',
        manifest.xoServerVersion,
        xoServerVersion
      )
    }

    // never mix a customer configuration with the one of another XO
    const servers = await xo.call('server.getAll')
    const nonEmptyStores = []
    for (const [name, store] of Object.entries(taskStores.stores)) {
      if (!(await isStoreEmpty(store))) {
        nonEmptyStores.push(name)
      }
    }
    if (servers.length !== 0 || nonEmptyStores.length !== 0) {
      throw new Error(
        `this XO is not empty (${servers.length} servers, non empty stores: ${nonEmptyStores.join(', ') || 'none'})`
      )
    }

    const urlsByPool = new Map()
    for (const [poolId, recordsByType] of recordsByTypeByPool) {
      const fakeXapi = await createFakeXapi(recordsByType, { host: values.host })
      fakeXapis.push(fakeXapi)
      urlsByPool.set(poolId, fakeXapi.url)
      console.log('pool %s served on %s', poolId, fakeXapi.url)
    }

    // second pass: tasks are written in the database, the configuration is imported by XO
    const config = {}
    let tasks = 0
    for await (const line of readBundleLines(bundlePath, passphrase)) {
      if (line.kind === 'config') {
        config[line.entry] = line.data
      } else if (line.kind === 'task' && Object.hasOwn(taskStores.stores, line.store)) {
        await taskStores.stores[line.store].put(line.key, line.value)
        ++tasks
      }
    }

    const importedConfig = neutralizeConfig(config, { currentUser, urlsByPool })
    const { $sendTo } = await xo.call('xo.importConfig')
    const res = await fetch(new URL($sendTo, values.xo), { method: 'POST', body: JSON.stringify(importedConfig) })
    if (!res.ok) {
      throw new Error(`config import failed with status ${res.status}: ${await res.text()}`)
    }
    console.log('imported %d tasks and the config entries: %s', tasks, Object.keys(importedConfig).join(', '))
  } catch (error) {
    await closeFakeXapis()
    throw error
  } finally {
    xo.close()
    await taskStores.close()
  }

  console.log('serving the XAPI objects, press Ctrl+C to stop')
  process.once('SIGINT', closeFakeXapis)
}

main(process.argv.slice(2)).catch(error => {
  console.error(error)
  process.exitCode = 1
})
