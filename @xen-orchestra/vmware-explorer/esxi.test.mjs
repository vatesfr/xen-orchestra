import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { describe, it } from 'node:test'
import { EventEmitter, once } from 'node:events'
import { PassThrough } from 'node:stream'

import Esxi from './esxi.mjs'

const moRef = (type, value) => ({ attributes: { type }, $value: value })

// a page of a RetrievePropertiesEx response
const page = (objects, token) => ({ returnval: { objects, token } })

// two datacenters and three datastores, shaped as the SOAP library returns them
const DATACENTERS = [
  {
    obj: moRef('Datacenter', 'datacenter-1'),
    propSet: [
      { name: 'name', val: { $value: 'dc-main', attributes: { 'xsi:type': 'string' } } },
      {
        name: 'datastore',
        val: {
          attributes: { 'xsi:type': 'ArrayOfManagedObjectReference' },
          ManagedObjectReference: [moRef('Datastore', 'datastore-11'), moRef('Datastore', 'datastore-12')],
        },
      },
    ],
  },
  {
    obj: moRef('Datacenter', 'datacenter-2'),
    propSet: [
      { name: 'name', val: { $value: 'dc-other' } },
      // a single reference is not wrapped in an array
      { name: 'datastore', val: { attributes: {}, ManagedObjectReference: moRef('Datastore', 'datastore-21') } },
    ],
  },
]

const DATASTORES = [
  // a single property is not wrapped in an array either
  { obj: moRef('Datastore', 'datastore-11'), propSet: { name: 'name', val: { $value: 'ds main' } } },
  { obj: moRef('Datastore', 'datastore-12'), propSet: [{ name: 'name', val: { $value: 'ds2' } }] },
  { obj: moRef('Datastore', 'datastore-21'), propSet: [{ name: 'name', val: { $value: 'ds3' } }] },
]

const INVENTORY_RESPONSES = {
  CreateContainerView: () => ({ returnval: moRef('ContainerView', 'session[42]view-1') }),
  DestroyView: () => ({}),
  RetrievePropertiesEx: ({ specSet }) => page(specSet[0].propSet[0].type === 'Datacenter' ? DATACENTERS : DATASTORES),
}

/**
 * Records the calls made to the host and answers them with canned responses.
 *
 * A response is a function of the arguments of the call; an absent one answers `undefined`, as the
 * host does when nothing matches.
 */
class FakeVimClient {
  constructor(responses = INVENTORY_RESPONSES) {
    this.calls = []
    this.responses = responses
    this.serviceContent = {
      propertyCollector: moRef('PropertyCollector', 'propertyCollector'),
      rootFolder: moRef('Folder', 'group-d1'),
      viewManager: moRef('ViewManager', 'ViewManager'),
    }
    this.authCookie = { cookies: 'vmware_soap_session="42"' }
    this.closed = false
  }

  async connect() {}

  async call(method, args) {
    this.calls.push({ method, args })
    return this.responses[method]?.(args)
  }

  async close() {
    this.closed = true
  }

  get methods() {
    return this.calls.map(({ method }) => method)
  }

  callsTo(method) {
    return this.calls.filter(call => call.method === method)
  }
}

/** a minimal `fetch` response */
const response = ({ status = 200, statusText = 'OK', headers = {}, body = '' } = {}) => ({
  status,
  statusText,
  headers: new Headers(headers),
  body: { cancel: async () => {} },
  text: async () => body,
})

/** connects with the inventory above, then hands the client over to the test */
const connectedEsxi = async ({ responses, ...options } = {}) => {
  const vimClient = new FakeVimClient()
  const esxi = new Esxi('esxi.test', 'user', 'password', true, { ...options, vimClient })
  await once(esxi, 'ready')

  if (responses !== undefined) {
    vimClient.responses = { ...INVENTORY_RESPONSES, ...responses }
  }
  vimClient.calls.length = 0

  return { esxi, vimClient }
}

describe('search', function () {
  it('destroys the container view it created', async function () {
    const { esxi, vimClient } = await connectedEsxi({ responses: { RetrievePropertiesEx: () => page([]) } })

    await esxi.search('VirtualMachine', ['config'])

    const destroyed = vimClient.callsTo('DestroyView')
    assert.equal(destroyed.length, 1)
    assert.deepEqual(destroyed[0].args, { _this: moRef('ContainerView', 'session[42]view-1') })
  })

  it('returns an empty result instead of throwing on an empty inventory', async function () {
    // no `returnval` at all
    const { esxi, vimClient } = await connectedEsxi({ responses: { RetrievePropertiesEx: () => ({}) } })

    assert.deepEqual(await esxi.search('VirtualMachine', ['config']), {})
    assert.equal(vimClient.callsTo('DestroyView').length, 1)
  })

  it('keeps falsy scalars', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page([
            {
              obj: moRef('VirtualMachine', 'vm-1'),
              propSet: [
                { name: 'empty', val: { $value: '', attributes: { 'xsi:type': 'string' } } },
                { name: 'zero', val: { $value: 0 } },
                { name: 'no', val: { $value: false } },
              ],
            },
          ]),
      },
    })

    assert.deepEqual(await esxi.search('VirtualMachine', ['empty', 'zero', 'no']), {
      'vm-1': { empty: '', zero: 0, no: false },
    })
  })

  it('handles an object without any readable property', async function () {
    const { esxi } = await connectedEsxi({
      responses: { RetrievePropertiesEx: () => page({ obj: moRef('VirtualMachine', 'vm-1') }) },
    })

    assert.deepEqual(await esxi.search('VirtualMachine', ['config']), { 'vm-1': {} })
  })

  it('merges the pages of an object split across them', async function () {
    let continued = 0
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page(
            [{ obj: moRef('VirtualMachine', 'vm-1'), propSet: [{ name: 'name', val: { $value: 'vm' } }] }],
            'token-1'
          ),
        ContinueRetrievePropertiesEx: () =>
          ++continued === 1
            ? page(
                [
                  {
                    obj: moRef('VirtualMachine', 'vm-1'),
                    propSet: [{ name: 'runtime', val: { attributes: {}, powerState: 'poweredOn' } }],
                  },
                ],
                'token-1'
              )
            : page([{ obj: moRef('VirtualMachine', 'vm-2'), propSet: [{ name: 'name', val: { $value: 'other' } }] }]),
      },
    })

    assert.deepEqual(await esxi.search('VirtualMachine', ['name', 'runtime']), {
      'vm-1': { name: 'vm', runtime: { powerState: 'poweredOn' } },
      'vm-2': { name: 'other' },
    })
    // the retrieval was consumed entirely, there is nothing to cancel
    assert.equal(vimClient.callsTo('CancelRetrievePropertiesEx').length, 0)
    assert.equal(vimClient.callsTo('DestroyView').length, 1)
  })

  it('cancels an interrupted retrieval and still destroys the view', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () => page([], 'token-1'),
        ContinueRetrievePropertiesEx: () => {
          throw new Error('connection reset')
        },
      },
    })

    await assert.rejects(esxi.search('VirtualMachine', ['config']), /connection reset/)

    assert.deepEqual(vimClient.callsTo('CancelRetrievePropertiesEx')[0].args, {
      _this: moRef('PropertyCollector', 'propertyCollector'),
      token: 'token-1',
    })
    assert.equal(vimClient.callsTo('DestroyView').length, 1)
  })

  it('asks for a bounded page size', async function () {
    const { esxi, vimClient } = await connectedEsxi({ responses: { RetrievePropertiesEx: () => page([]) } })

    await esxi.search('VirtualMachine', ['config'], { maxObjects: 10 })

    assert.deepEqual(vimClient.callsTo('RetrievePropertiesEx')[0].args.options, {
      attributes: { 'xsi:type': 'RetrieveOptions' },
      maxObjects: 10,
    })
  })
})

describe('connection', function () {
  it('emits ready once the datacenters are known, without one request per datastore', async function () {
    const vimClient = new FakeVimClient()
    const esxi = new Esxi('esxi.test', 'user', 'password', true, { vimClient })

    await once(esxi, 'ready')

    assert.deepEqual(vimClient.methods.toSorted(), [
      'CreateContainerView',
      'CreateContainerView',
      'DestroyView',
      'DestroyView',
      'RetrievePropertiesEx',
      'RetrievePropertiesEx',
    ])
  })

  it('resolves the datacenter of a datastore when downloading', async function () {
    const requests = []
    const { esxi } = await connectedEsxi({
      fetch: async (url, options) => {
        requests.push({ url, options })
        return response({ status: 206 })
      },
    })

    await esxi.download('ds main', 'vm/vm.vmdk', { range: '0-511' })

    const { url, options } = requests[0]
    assert.equal(url.host, 'esxi.test')
    assert.equal(url.pathname, '/folder/vm/vm.vmdk')
    assert.equal(url.searchParams.get('dsName'), 'ds main')
    assert.equal(url.searchParams.get('dcPath'), 'dc-main')
    assert.equal(options.headers.Range, 'bytes=0-511')
    // a request body has no content type
    assert.equal(options.headers['content-type'], undefined)
  })

  it('maps the datastores of every datacenter', async function () {
    const requested = []
    const { esxi } = await connectedEsxi({
      fetch: async url => {
        requested.push(url.searchParams.get('dcPath'))
        return response()
      },
    })

    await esxi.download('ds2', 'a.vmdk')
    await esxi.download('ds3', 'a.vmdk')

    assert.deepEqual(requested, ['dc-main', 'dc-other'])
  })

  it('closes the session', async function () {
    const { esxi, vimClient } = await connectedEsxi()

    await esxi.close()

    assert.equal(vimClient.closed, true)
  })
})

describe('download', function () {
  const downloadEsxi = async fetchImplementation => {
    const requests = []
    const { esxi } = await connectedEsxi({
      fetch: async (url, options) => {
        requests.push({ url, options })
        return fetchImplementation(requests.length, options)
      },
    })
    return { esxi, requests }
  }

  it('reuses the session cookie instead of authenticating on every request', async function () {
    const { esxi, requests } = await downloadEsxi(() =>
      response({ headers: { 'set-cookie': 'vmware_soap_session="42"; Path=/; HttpOnly' } })
    )

    await esxi.download('ds2', 'a.vmdk')
    await esxi.download('ds2', 'a.vmdk')

    assert.equal(requests[0].options.headers.Authorization?.startsWith('Basic '), true)
    assert.equal(requests[1].options.headers.Authorization, undefined)
    assert.equal(requests[1].options.headers.cookie, 'vmware_soap_session="42"')
  })

  it('authenticates again when the session expired', async function () {
    const { esxi, requests } = await downloadEsxi((attempt, options) => {
      if (attempt === 1) {
        return response({ headers: { 'set-cookie': 'vmware_soap_session="42"' } })
      }
      // the host rejects the cookie of an expired session
      return options.headers.cookie !== undefined
        ? response({ status: 401, statusText: 'Unauthorized' })
        : response({ headers: { 'set-cookie': 'vmware_soap_session="1337"' } })
    })

    await esxi.download('ds2', 'a.vmdk')
    await esxi.download('ds2', 'a.vmdk', { retryDelay: 1 })

    assert.equal(requests.length, 3)
    assert.equal(requests[1].options.headers.cookie, 'vmware_soap_session="42"')
    // the retry falls back to the credentials, and picks up the new session
    assert.equal(requests[2].options.headers.Authorization?.startsWith('Basic '), true)
  })

  it('does not retry a missing file', async function () {
    const { esxi, requests } = await downloadEsxi(() =>
      response({ status: 404, statusText: 'Not Found', body: 'no such file' })
    )

    await assert.rejects(esxi.download('ds2', 'missing.vmdk'), error => {
      assert.match(error.message, /^404 Not Found /)
      assert.equal(error.cause.status, 404)
      assert.equal(error.cause.body, 'no such file')
      return true
    })
    assert.equal(requests.length, 1)
  })

  it('does not retry an unknown datastore', async function () {
    const { esxi, requests } = await downloadEsxi(() => response())

    await assert.rejects(esxi.download('not-a-datastore', 'a.vmdk'))

    assert.equal(requests.length, 0)
  })

  it('retries a network failure', async function () {
    const { esxi, requests } = await downloadEsxi(attempt => {
      if (attempt < 3) {
        const error = new TypeError('fetch failed')
        error.cause = { code: 'ECONNRESET' }
        throw error
      }
      return response()
    })

    await esxi.download('ds2', 'a.vmdk', { retryDelay: 1 })

    assert.equal(requests.length, 3)
  })

  it('gives up after the last retry', async function () {
    const { esxi, requests } = await downloadEsxi(() => response({ status: 503, statusText: 'Service Unavailable' }))

    await assert.rejects(esxi.download('ds2', 'a.vmdk', { retries: 2, retryDelay: 1 }), { message: /^503 / })

    assert.equal(requests.length, 3)
  })

  it('stops retrying when aborted', async function () {
    const controller = new AbortController()
    const { esxi, requests } = await downloadEsxi(() => {
      controller.abort()
      const error = new Error('socket hang up')
      error.code = 'ECONNRESET'
      throw error
    })

    await assert.rejects(esxi.download('ds2', 'a.vmdk', { retryDelay: 1, signal: controller.signal }), {
      name: 'AbortError',
    })
    assert.equal(requests.length, 1)
  })

  it('fails when the host ignores the requested range', async function () {
    // reading the answer as if it were the range would use as much memory as the file is big
    const { esxi, requests } = await downloadEsxi(() => response({ status: 200 }))

    await assert.rejects(esxi.download('ds2', 'a.vmdk', { range: '0-511', retryDelay: 1 }), {
      message: /^the range 0-511 was ignored by the host \(status 200\)/,
    })
    assert.equal(requests.length, 1)
  })
})

// a RetrievePropertiesEx response for a single object and a single property
const propertyOf = (type, id, name, val) => ({
  returnval: { objects: [{ obj: moRef(type, id), propSet: [{ name, val }] }] },
})

const taskInfo = (state, extra = {}) =>
  propertyOf('Task', 'task-1', 'info', {
    attributes: { 'xsi:type': 'TaskInfo' },
    key: 'task-1',
    state,
    ...extra,
  })

const startedTask = () => ({ returnval: moRef('Task', 'task-1') })

describe('tasks', function () {
  it('resolves with the info of the successful task', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo('success'),
      },
    })

    // the info is not wrapped in arrays, unlike what `fetchProperty` returns
    assert.deepEqual(await esxi.powerOff('vm-1'), { key: 'task-1', state: 'success' })

    // the property is read on the task itself, no container view is involved
    assert.deepEqual(vimClient.methods, ['PowerOffVM_Task', 'RetrievePropertiesEx'])
    const { specSet } = vimClient.callsTo('RetrievePropertiesEx')[0].args
    assert.deepEqual(specSet[0].objectSet[0].obj, { attributes: { type: 'Task' }, $value: 'task-1' })
    assert.deepEqual(specSet[0].propSet[0].pathSet, ['info'])
  })

  it('fails as soon as the task is in error, with the fault of the host', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        RetrievePropertiesEx: () =>
          taskInfo('error', {
            error: {
              attributes: { 'xsi:type': 'LocalizedMethodFault' },
              fault: { attributes: { 'xsi:type': 'InvalidPowerState' } },
              localizedMessage: 'The attempted operation cannot be performed in the current state (Powered off).',
            },
          }),
      },
    })

    await assert.rejects(esxi.powerOff('vm-1'), error => {
      assert.match(error.message, /^PowerOffVM_Task failed: The attempted operation cannot be performed/)
      assert.equal(error.code, 'InvalidPowerState')
      assert.equal(error.vmId, 'vm-1')
      return true
    })

    // a failed task is not polled until the timeout
    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 1)
  })

  it('gives up when the task takes longer than its timeout', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        RemoveAllSnapshots_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo('running'),
      },
    })

    await assert.rejects(esxi.removeAllSnapshots('vm-1', { timeout: 0 }), {
      message: 'RemoveAllSnapshots_Task did not complete within 0s (state: running)',
    })
  })

  it('stops polling when aborted', async function () {
    const controller = new AbortController()
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        CreateSnapshotEx_Task: () => startedTask(),
        RetrievePropertiesEx: () => {
          controller.abort()
          return taskInfo('running')
        },
      },
    })

    await assert.rejects(esxi.snapshot('vm-1', 'name', 'description', { signal: controller.signal }), {
      name: 'AbortError',
    })
    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 1)
  })

  it('waits for the completion of a power on', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        PowerOnVM_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo('success'),
      },
    })

    await esxi.powerOn('vm-1')

    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 1)
  })

  it('polls again while the task is running', async function () {
    let polls = 0
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo(++polls === 1 ? 'running' : 'success'),
      },
    })

    await esxi.powerOff('vm-1')

    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 2)
  })

  it('reports a method which did not start a task', async function () {
    const { esxi } = await connectedEsxi({ responses: { ResetVM_Task: () => ({}) } })

    await assert.rejects(esxi.reset('vm-1'), { message: 'ResetVM_Task did not return a task' })
  })

  it('reports a task which disappeared', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        // the object is gone: no property is returned
        RetrievePropertiesEx: () => ({}),
      },
    })

    await assert.rejects(esxi.powerOff('vm-1'), { code: 'NO_PROPERTY' })
  })
})

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

describe('getAllVmMetadata', function () {
  const vm = (id, propSet) => ({ obj: moRef('VirtualMachine', id), propSet })

  const CONFIG = {
    name: 'config',
    val: { attributes: {}, name: 'a vm', firmware: 'efi', hardware: { memoryMB: '2048', numCPU: '2' } },
  }
  const STORAGE = {
    name: 'storage',
    val: { attributes: {}, perDatastoreUsage: { committed: '1024', uncommitted: '2048' } },
  }
  const RUNTIME = { name: 'runtime', val: { attributes: {}, powerState: 'poweredOn' } }

  it('reports the VMs of the host', async function () {
    const { esxi } = await connectedEsxi({
      responses: { RetrievePropertiesEx: () => page([vm('vm-1', [CONFIG, STORAGE, RUNTIME])]) },
    })

    assert.deepEqual(await esxi.getAllVmMetadata(), [
      {
        id: 'vm-1',
        hasAllExtentsListed: true,
        nameLabel: 'a vm',
        memory: 2048 * 1024 * 1024,
        nCpus: 2,
        guestToolsInstalled: false,
        firmware: 'uefi',
        powerState: 'poweredOn',
        storage: { used: 1024, free: 2048 },
      },
    ])
  })

  it('ignores a VM whose properties are incomplete instead of failing the listing', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page([
            // a VM being created has no readable runtime
            vm('vm-1', [CONFIG, STORAGE]),
            vm('vm-2', [CONFIG, STORAGE, RUNTIME]),
          ]),
      },
    })

    assert.deepEqual(
      (await esxi.getAllVmMetadata()).map(({ id }) => id),
      ['vm-2']
    )
  })

  it('detects a disk whose extent is not listed', async function () {
    const layoutEx = files => ({ name: 'layoutEx', val: { attributes: {}, ...files } })
    const { esxi } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page([
            vm('vm-1', [
              CONFIG,
              STORAGE,
              RUNTIME,
              // a single chain and a single file are not wrapped in arrays
              layoutEx({
                disk: { chain: { fileKey: ['1', '2'] } },
                file: { key: '2', type: 'diskDescriptor' },
              }),
            ]),
          ]),
      },
    })

    assert.equal((await esxi.getAllVmMetadata())[0].hasAllExtentsListed, false)
  })
})

describe('getTransferableVmMetadata', function () {
  const VMX = `config.version = "8"
scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:1.present = "TRUE"
scsi0:1.deviceType = "scsi-hardDisk"
scsi0:1.fileName = "vm-000001.vmdk"
ide0:0.present = "TRUE"
ide0:0.deviceType = "cdrom-image"
ethernet0.present = "TRUE"
ethernet0.networkName = "VM Network"
ethernet0.addressType = "generated"
ethernet0.generatedAddress = "00:0c:29:00:00:01"
`

  const DESCRIPTOR = `# Disk DescriptorFile
version=1
CID=d7980f7a
parentCID=ffffffff
createType="vmfs"

RW 67108864 VMFS "vm-000001-flat.vmdk"
`

  const CONFIG_RESPONSE = `<FetchResponse><returnval>
    <name>a vm</name>
    <guestId>ubuntu64Guest</guestId>
    <guestFullName>Ubuntu Linux (64-bit)</guestFullName>
    <firmware>efi</firmware>
    <files><vmPathName>[ds main] a.vm/a.vm.vmx</vmPathName></files>
    <hardware><memoryMB>2048</memoryMB><numCPU>2</numCPU></hardware>
  </returnval></FetchResponse>`

  const RUNTIME_RESPONSE = '<FetchResponse><returnval><powerState>poweredOn</powerState></returnval></FetchResponse>'

  const DATASTORE_SUMMARIES = [
    {
      obj: moRef('Datastore', 'datastore-11'),
      propSet: [{ name: 'summary', val: { attributes: {}, name: 'ds main', url: '/vmfs/volumes/uuid-1' } }],
    },
  ]

  /**
   * @param {object} [options]
   * @param {number} [options.vmsdStatus] - status of the response to the vmsd request
   */
  const transferableEsxi = async ({ vmsdStatus = 404 } = {}) => {
    const requested = []
    const { esxi } = await connectedEsxi({
      responses: {
        // the datastores are listed through the property collector, the rest through `Fetch`
        RetrievePropertiesEx: ({ specSet }) =>
          specSet[0].propSet[0].type === 'Datastore' ? page(DATASTORE_SUMMARIES) : page(DATACENTERS),
      },
      fetch: async (url, options) => {
        if (options.method === 'POST') {
          return response({ body: options.body.includes('runtime') ? RUNTIME_RESPONSE : CONFIG_RESPONSE })
        }
        const path = url.pathname
        requested.push(path)
        if (path.endsWith('.vmx')) {
          return response({ body: VMX })
        }
        if (path.endsWith('.vmsd')) {
          return response({ status: vmsdStatus, statusText: 'Not Found', body: '' })
        }
        return response({ body: DESCRIPTOR })
      },
    })
    return { esxi, requested }
  }

  it('labels a disk with its own channel index', async function () {
    const { esxi } = await transferableEsxi()

    const { disks } = await esxi.getTransferableVmMetadata('vm-1')

    assert.equal(disks.length, 1)
    // the channel holds no scsi0:0, the disk used to be labelled as such
    assert.equal(disks[0].node, 'scsi0:1')
    assert.equal(disks[0].datastore, 'ds main')
    assert.equal(disks[0].diskPath, 'a.vm/vm-000001.vmdk')
  })

  it('unwraps every value of the config', async function () {
    const { esxi } = await transferableEsxi()

    const metadata = await esxi.getTransferableVmMetadata('vm-1')

    assert.equal(metadata.name_label, 'a vm')
    assert.equal(metadata.guestId, 'ubuntu64Guest')
    // used to be returned as a one element array
    assert.equal(metadata.guestFullName, 'Ubuntu Linux (64-bit)')
    assert.equal(metadata.firmware, 'uefi')
    assert.equal(metadata.powerState, 'poweredOn')
    assert.equal(metadata.memory, 2048 * 1024 * 1024)
    assert.equal(metadata.nCpus, 2)
    assert.equal(metadata.cdrom, true)
    assert.deepEqual(metadata.networks, [{ label: 'VM Network', macAddress: '00:0c:29:00:00:01', isGenerated: true }])
  })

  it('treats a missing vmsd as a VM without snapshot', async function () {
    const { esxi } = await transferableEsxi()

    assert.equal((await esxi.getTransferableVmMetadata('vm-1')).snapshots, undefined)
  })

  it('does not report an unreadable vmsd as a VM without snapshot', async function () {
    // silently transferring a full disk instead of a delta is worse than failing
    const { esxi } = await transferableEsxi({ vmsdStatus: 403 })

    await assert.rejects(esxi.getTransferableVmMetadata('vm-1'), { message: /^403 / })
  })
})

describe('fetchProperty', function () {
  const fetchPropertyEsxi = async fetchImplementation => {
    const requests = []
    const { esxi } = await connectedEsxi({
      fetch: async (url, options) => {
        requests.push({ url, options })
        return fetchImplementation(options)
      },
    })
    return { esxi, requests }
  }

  it('escapes the values it interpolates in the envelope', async function () {
    const { esxi, requests } = await fetchPropertyEsxi(() => ({
      status: 200,
      statusText: 'OK',
      text: async () => '<FetchResponse><returnval>ok</returnval></FetchResponse>',
    }))

    await esxi.fetchProperty('VirtualMachine', 'vm-1" & <injected/>', 'config')

    const { body } = requests[0].options
    assert.ok(!body.includes('<injected/>'), body)
    assert.ok(body.includes('vm-1&quot; &amp; &lt;injected/&gt;'), body)
  })

  it('reports the fault of the host instead of a generic message', async function () {
    const { esxi } = await fetchPropertyEsxi(() => ({
      status: 500,
      statusText: 'Internal Server Error',
      text: async () =>
        `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><soapenv:Fault><faultcode>ServerFaultCode</faultcode><faultstring>The object &apos;vim.VirtualMachine:vm-42&apos; has already been deleted</faultstring><detail><ManagedObjectNotFoundFault xmlns="urn:vim25" xsi:type="ManagedObjectNotFound"/></detail></soapenv:Fault></soapenv:Body></soapenv:Envelope>`,
    }))

    await assert.rejects(esxi.fetchProperty('VirtualMachine', 'vm-42', 'config'), error => {
      assert.match(error.message, /has already been deleted$/)
      assert.equal(error.code, 'ManagedObjectNotFound')
      assert.equal(error.cause.status, 500)
      return true
    })
  })

  it('still returns the legacy shape', async function () {
    const { esxi } = await fetchPropertyEsxi(() => ({
      status: 200,
      statusText: 'OK',
      text: async () => '<FetchResponse><returnval><state>success</state></returnval></FetchResponse>',
    }))

    // values wrapped in arrays: this is why `#retrieveProperty` exists
    assert.deepEqual(await esxi.fetchProperty('Task', 'task-1', 'info'), { state: ['success'] })
  })
})
