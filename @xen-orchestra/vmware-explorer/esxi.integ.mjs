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
  const fakeNbdkit = ({ exitWith, failWith } = {}) => {
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
      } else if (exitWith !== undefined) {
        // nbdkit exits on a bad thumbprint or a missing vddk library, without ever listening
        setImmediate(() => {
          child.exitCode = exitWith
          child.emit('exit', exitWith, null)
        })
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

  it('spawns one server per disk, and shares it', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const [first, second] = await Promise.all([
      esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk'),
      esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk'),
    ])

    // the promise is memoized: two concurrent calls used to spawn two servers, orphaning one
    assert.equal(spawned.length, 1)
    assert.equal(first.value, second.value)
    const server = first.value
    assert.equal(server.nbdInfos.exportname, '[ds] vm/vm.vmdk')
    assert.equal(server.nbdInfos.port, spawned[0].port)

    // the server belongs to both of them: the first to let go must not stop it
    await first.dispose()
    assert.equal(server.process.exitCode, null)

    await second.dispose()
    assert.equal(server.process.exitCode, 0)

    await esxi.close()
  })

  it('spawns a new server after the previous one was killed', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const first = await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')
    const firstServer = first.value
    await first.dispose()
    const second = await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')

    // the entry used to be left in the map, so this handed out the dead process of a closed port
    assert.equal(spawned.length, 2)
    assert.notEqual(firstServer.nbdInfos.port, second.value.nbdInfos.port)
    assert.equal(firstServer.process.exitCode, 0)

    await esxi.close()
  })

  it('forgets a server which died on its own', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    const first = await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')
    spawned[0].server.close()
    first.value.process.exitCode = 1
    first.value.process.emit('exit', 1, null)
    await first.value.died

    await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')

    assert.equal(spawned.length, 2)

    await esxi.close()
  })

  it('reports a missing nbdkit instead of terminating the process', async function () {
    const error = new Error('spawn nbdkit ENOENT')
    error.code = 'ENOENT'
    const { esxi, spawned } = await nbdkitEsxi({ failWith: error })

    // without an 'error' listener on the child process, this used to be an uncaught event
    await assert.rejects(esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk'), { code: 'ENOENT' })

    // the failure is not memoized either
    await assert.rejects(esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk'), { code: 'ENOENT' })
    assert.equal(spawned.length, 2)
  })

  it('reports an nbdkit which exited before being ready', async function () {
    const { esxi, spawned } = await nbdkitEsxi({ exitWith: 1 })

    // waiting for the port would otherwise burn the whole readiness timeout
    await assert.rejects(esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk'), {
      code: 'NBDKIT_EXITED',
      message: /^nbdkit exited with code 1 before being ready/,
    })
    assert.equal(spawned.length, 1)

    await esxi.close()
  })

  it('never passes the password on the command line', async function () {
    const { esxi, spawned } = await nbdkitEsxi()

    await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')

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

    // never disposed: closing is the safety net for a caller which leaked its disposable
    const disposable = await esxi.getNbdServer('vm-1', '[ds] vm/vm.vmdk')
    const server = disposable.value
    await esxi.close()

    assert.equal(server.process.exitCode, 0)
    assert.equal(spawned.length, 1)

    // disposing after the close has nothing left to do, and must not throw
    await disposable.dispose()
  })
})
