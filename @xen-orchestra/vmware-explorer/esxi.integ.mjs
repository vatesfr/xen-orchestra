import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import { connectedEsxi } from './esxi.fixtures.mjs'

// these bind a real port and write real temporary files, unlike the rest of the suite
describe('nbdkit servers', function () {
  /**
   * Stands in for nbdkit: it listens on the port it is given, so that the readiness probe of the
   * server under test is exercised for real.
   */
  const fakeNbdkit = ({ failWith } = {}) => {
    const spawned = []
    const spawn = (command, args) => {
      const child = new EventEmitter()
      child.exitCode = null
      child.signalCode = null
      child.stdout = new PassThrough()
      child.stderr = new PassThrough()
      child.kill = signal => {
        child.signalCode = signal ?? 'SIGTERM'
        child.exitCode = 0
        entry.server?.close()
        setImmediate(() => child.emit('exit', 0, child.signalCode))
        return true
      }

      const port = Number(args.find(argument => argument.startsWith('--port=')).slice('--port='.length))
      const entry = { args, child, command, port }
      spawned.push(entry)

      if (failWith !== undefined) {
        setImmediate(() => child.emit('error', failWith))
      } else {
        entry.server = createServer()
        entry.server.listen(port, '127.0.0.1')
      }
      return child
    }
    return { spawn, spawned }
  }

  const nbdkitEsxi = async options => {
    const { spawn, spawned } = fakeNbdkit(options)
    const { esxi } = await connectedEsxi({ spawn })
    // the thumbprint is the only step of a spawn which needs the real host
    esxi.getServerThumbprint = async () => 'AA:BB:CC'
    return { esxi, spawned }
  }

  it('spawns one server per disk, and reuses it', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const [first, second] = await Promise.all([
      esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk'),
      esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk'),
    ])

    // the promise is memoized: two concurrent calls used to spawn two servers, orphaning one
    assert.equal(spawned.length, 1)
    assert.equal(first, second)
    assert.equal(first.nbdInfos.exportname, '[ds] vm/vm.vmdk')
    assert.equal(first.nbdInfos.port, spawned[0].port)

    await esxi.close()
  })

  it('spawns a new server after the previous one was killed', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const first = await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')
    await esxi.killNbdServer('vm-1', '[ds] vm/vm.vmdk')
    const second = await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')

    // the entry used to be left in the map, so this handed out the dead process of a closed port
    assert.equal(spawned.length, 2)
    assert.notEqual(first.nbdInfos.port, second.nbdInfos.port)
    assert.equal(first.process.exitCode, 0)

    await esxi.close()
  })

  it('forgets a server which died on its own', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const first = await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')
    spawned[0].server.close()
    first.process.exitCode = 1
    first.process.emit('exit', 1, null)
    await first.died

    await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')

    assert.equal(spawned.length, 2)

    await esxi.close()
  })

  it('reports a missing nbdkit instead of terminating the process', async function () {
    const error = new Error('spawn nbdkit ENOENT')
    error.code = 'ENOENT'
    const { esxi, spawned } = await nbdkitEsxi({ failWith: error })

    // without an 'error' listener on the child process, this used to be an uncaught event
    await assert.rejects(esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk'), { code: 'ENOENT' })

    // the failure is not memoized either
    await assert.rejects(esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk'), { code: 'ENOENT' })
    assert.equal(spawned.length, 2)
  })

  it('never passes the password on the command line', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')

    assert.equal(
      spawned[0].args.some(argument => argument.includes('password')),
      true
    )
    assert.equal(
      spawned[0].args.some(argument => argument.includes('password=password')),
      false
    )

    await esxi.close()
  })

  it('kills the remaining servers when closing', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const server = await esxi.spawnNbdKitProcess('vm-1', '[ds] vm/vm.vmdk')
    await esxi.close()

    assert.equal(server.process.exitCode, 0)
    assert.equal(spawned.length, 1)
  })
})
