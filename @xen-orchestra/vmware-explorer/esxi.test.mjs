import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { once } from 'node:events'

import { connectedEsxi, DATACENTERS, FakeVimClient, moRef, page, response } from './esxi.fixtures.mjs'
import Esxi from './esxi.mjs'

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

  it('fails when the host answers more than the requested range', async function () {
    // reading the answer as if it were the range would use as much memory as the file is big
    const { esxi, requests } = await downloadEsxi(() => response({ status: 200, body: Buffer.alloc(4096) }))

    await assert.rejects(esxi.download('ds2', 'a.vmdk', { range: '0-511', retryDelay: 1 }), {
      code: 'RANGE_IGNORED',
      message: /^the range 0-511 was ignored by the host \(status 200, 4096 bytes\)/,
    })
    assert.equal(requests.length, 1)
  })

  it('fails when the size of the answer to a range is unknown', async function () {
    // a chunked answer cannot be checked, and `Number(null)` is 0: the whole file used to pass
    const { esxi } = await downloadEsxi(() => ({
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      body: { cancel: async () => {} },
      arrayBuffer: async () => new ArrayBuffer(4096),
    }))

    await assert.rejects(esxi.download('ds2', 'huge.vmdk', { range: '0-2047', retryDelay: 1 }), {
      code: 'RANGE_IGNORED',
      message: /^the range 0-2047 was ignored by the host \(status 200, null bytes\)/,
    })
  })

  it('accepts a whole file answered to a range which covers it', async function () {
    // what `/folder` does for a vmdk descriptor of a few hundred bytes read as `0-511`
    const { esxi } = await downloadEsxi(() => response({ status: 200, body: Buffer.alloc(293) }))

    const res = await esxi.download('ds2', 'descriptor.vmdk', { range: '0-511' })

    assert.equal((await res.arrayBuffer()).byteLength, 293)
  })

  it('fails when a range not starting at the first byte is answered with a 200', async function () {
    // such an answer starts at the first byte, using it would read the wrong offset
    const { esxi } = await downloadEsxi(() => response({ status: 200, body: Buffer.alloc(16) }))

    await assert.rejects(esxi.download('ds2', 'a.vmdk', { range: '2048-2063', retryDelay: 1 }), {
      code: 'RANGE_IGNORED',
      message: /^the range 2048-2063 was ignored by the host/,
    })
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

    // the info comes back unwrapped, in the same shape as `search`
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

  it('falls back to a code of its own when the host names no fault type', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo('error', { error: { localizedMessage: 'it did not work' } }),
      },
    })

    await assert.rejects(esxi.powerOff('vm-1'), {
      code: 'TASK_FAILED',
      message: 'PowerOffVM_Task failed: it did not work',
    })
  })

  it('gives up when the task takes longer than its timeout', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        RemoveAllSnapshots_Task: () => startedTask(),
        RetrievePropertiesEx: () => taskInfo('running'),
      },
    })

    await assert.rejects(esxi.removeAllSnapshots('vm-1', { timeout: 0 }), {
      code: 'TASK_TIMEOUT',
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

  it('keeps polling a task through a transient failure', async function () {
    let polls = 0
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        RemoveAllSnapshots_Task: () => startedTask(),
        RetrievePropertiesEx: () => {
          if (++polls === 1) {
            // the task keeps running on the host, reporting a failure would be a lie
            const error = new Error('socket hang up')
            error.code = 'ECONNRESET'
            throw error
          }
          return taskInfo('success')
        },
      },
    })

    await esxi.removeAllSnapshots('vm-1')

    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 2)
  })

  it('does not retry a poll which will not succeed', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: {
        PowerOffVM_Task: () => startedTask(),
        // the task object is gone
        RetrievePropertiesEx: () => ({}),
      },
    })

    await assert.rejects(esxi.powerOff('vm-1'), { code: 'NO_PROPERTY' })

    assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, 1)
  })

  it('reports a method which did not start a task', async function () {
    const { esxi } = await connectedEsxi({ responses: { ResetVM_Task: () => ({}) } })

    await assert.rejects(esxi.reset('vm-1'), {
      code: 'NO_TASK',
      message: 'ResetVM_Task did not return a task',
    })
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

  it('ignores a VM whose config is reported without its hardware', async function () {
    // a VM being created: `config` is there, `config.hardware` is not yet
    const { esxi } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page([
            vm('vm-1', [{ name: 'config', val: { attributes: {}, name: 'new vm' } }, STORAGE, RUNTIME]),
            vm('vm-2', [CONFIG, STORAGE, RUNTIME]),
          ]),
      },
    })

    assert.deepEqual(
      (await esxi.getAllVmMetadata()).map(({ id }) => id),
      ['vm-2']
    )
  })

  it('ignores a VM whose runtime is reported without its power state', async function () {
    const { esxi } = await connectedEsxi({
      responses: {
        RetrievePropertiesEx: () =>
          page([vm('vm-1', [CONFIG, STORAGE, { name: 'runtime', val: { attributes: {}, host: 'host-1' } }])]),
      },
    })

    assert.deepEqual(await esxi.getAllVmMetadata(), [])
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

  const config = vmPathName => ({
    attributes: { 'xsi:type': 'VirtualMachineConfigInfo' },
    name: 'a vm',
    guestId: 'ubuntu64Guest',
    guestFullName: 'Ubuntu Linux (64-bit)',
    firmware: 'efi',
    files: { vmPathName },
    hardware: { memoryMB: '2048', numCPU: '2' },
  })

  const RUNTIME = { attributes: { 'xsi:type': 'VirtualMachineRuntimeInfo' }, powerState: 'poweredOn' }

  const DATASTORE_SUMMARIES = [
    {
      obj: moRef('Datastore', 'datastore-11'),
      propSet: [{ name: 'summary', val: { attributes: {}, name: 'ds main', url: '/vmfs/volumes/uuid-1' } }],
    },
  ]

  /**
   * @param {object} [options]
   * @param {string} [options.vmPathName] - `files.vmPathName` reported for the VM
   * @param {number} [options.vmsdStatus] - status of the response to the vmsd request
   */
  const transferableEsxi = async ({ vmPathName = '[ds main] a.vm/a.vm.vmx', vmsdStatus = 404 } = {}) => {
    const requested = []
    const { esxi } = await connectedEsxi({
      responses: {
        // every property is read through the property collector, only the files are downloaded
        RetrievePropertiesEx: ({ specSet }) => {
          const { pathSet, type } = specSet[0].propSet[0]
          if (type === 'Datastore') {
            return page(DATASTORE_SUMMARIES)
          }
          if (type !== 'VirtualMachine') {
            return page(DATACENTERS)
          }
          return pathSet[0] === 'runtime'
            ? propertyOf('VirtualMachine', 'vm-1', 'runtime', RUNTIME)
            : propertyOf('VirtualMachine', 'vm-1', 'config', config(vmPathName))
        },
      },
      fetch: async (url, options) => {
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

  it('reports a vmx path it cannot parse', async function () {
    // destructuring the null match used to throw a TypeError naming nothing
    const { esxi } = await transferableEsxi({ vmPathName: 'a.vm/a.vm.vmx' })

    await assert.rejects(esxi.getTransferableVmMetadata('vm-1'), {
      code: 'BAD_VMX_PATH',
      message: "can't parse the path of the vmx of the VM vm-1: a.vm/a.vm.vmx",
      vmId: 'vm-1',
    })
  })

  it('does not report an unreadable vmsd as a VM without snapshot', async function () {
    // silently transferring a full disk instead of a delta is worse than failing
    const { esxi } = await transferableEsxi({ vmsdStatus: 403 })

    await assert.rejects(esxi.getTransferableVmMetadata('vm-1'), { message: /^403 / })
  })
})

describe('keepAlive', function () {
  it('touches the session with the cheapest call there is', async function () {
    const { esxi, vimClient } = await connectedEsxi({
      responses: { CurrentTime: () => ({ returnval: new Date(0) }) },
    })

    await esxi.keepAlive()

    // reading the whole `config` of a VM used to be the keep-alive
    assert.deepEqual(vimClient.methods, ['CurrentTime'])
    assert.deepEqual(vimClient.callsTo('CurrentTime')[0].args, { _this: 'ServiceInstance' })
  })
})

describe('getDataMap', function () {
  const BLOCK_LENGTH = 4096 * 512

  // the thumbprint is the first step of a spawn: failing it sends the code down the fallback
  // without binding a port nor writing a temporary file
  const failingThumbprint = async () => {
    throw new Error('no vddk on this machine')
  }

  const DELTA_DESCRIPTOR = `# Disk DescriptorFile
version=1
CID=d7980f7a
parentCID=aaaaaaaa
createType="vmfsSparse"
parentFileNameHint="vm.vmdk"

RW 16384 VMFSSPARSE "vm-000001-delta.vmdk"
`

  const cowdExtent = ({ allocated = [0, 2], numGdEntries = 4 } = {}) => {
    const header = Buffer.alloc(2048)
    header.write('COWD', 0, 'ascii')
    header.writeUInt32LE(1, 4) // version
    header.writeUInt32LE(3, 8) // flags
    header.writeUInt32LE((numGdEntries * BLOCK_LENGTH) / 512, 12) // capacity in sectors
    header.writeUInt32LE(1, 16) // one sector per grain
    header.writeUInt32LE(4, 20) // the grain directory follows the header
    header.writeUInt32LE(numGdEntries, 24)

    const grainDirectory = Buffer.alloc(numGdEntries * 4)
    for (const index of allocated) {
      // the sector of the grain table of the block, whatever it is
      grainDirectory.writeUInt32LE(8 + index, index * 4)
    }
    return { grainDirectory, header }
  }

  it('falls back to reading the metadata of a COWD delta', async function () {
    const { grainDirectory, header } = cowdExtent()
    const ranges = []

    const { esxi } = await connectedEsxi({
      fetch: async (url, options) => {
        ranges.push([url.pathname, options.headers.Range])
        if (url.pathname.endsWith('-delta.vmdk')) {
          // the extent: its header, then its grain directory
          return response({ status: 206, body: options.headers.Range === 'bytes=0-2047' ? header : grainDirectory })
        }
        return response({ status: 206, body: DELTA_DESCRIPTOR })
      },
    })
    esxi.getServerThumbprint = failingThumbprint

    const dataMap = await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', {
      baseDiskPath: 'a.vm/vm.vmdk',
    })

    assert.deepEqual(dataMap, [
      { offset: 0, length: BLOCK_LENGTH, type: 0 },
      { offset: 2 * BLOCK_LENGTH, length: BLOCK_LENGTH, type: 0 },
    ])

    // an HTTP range is inclusive: these used to ask for one byte too many, three times
    assert.deepEqual(ranges, [
      ['/folder/a.vm/vm-000001.vmdk', 'bytes=0-4095'],
      ['/folder/a.vm/vm-000001-delta.vmdk', 'bytes=0-2047'],
      ['/folder/a.vm/vm-000001-delta.vmdk', 'bytes=2048-2063'],
    ])
  })

  it('reports a delta which is not COWD with a code instead of an assertion', async function () {
    const { header } = cowdExtent()
    header.write('SESp', 0, 'ascii')

    const { esxi } = await connectedEsxi({
      fetch: async url =>
        response({ status: 206, body: url.pathname.endsWith('-delta.vmdk') ? header : DELTA_DESCRIPTOR }),
    })
    esxi.getServerThumbprint = failingThumbprint

    await assert.rejects(esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' }), {
      code: 'NO_DATA_MAP',
    })
  })

  // the change tracking of the host answers a delta without an nbdkit server nor the vddk
  describe('from the change tracking', function () {
    const CAPACITY = 16 * 1024 * 1024 * 1024
    const ACTIVE = '[ds main] a.vm/vm-000001.vmdk'
    const BASE = '[ds main] a.vm/vm.vmdk'
    const CHANGE_ID = '52 e3 b3 e3 20 78 92 1c-c0 52 92 c9 d7 e8 54 3e/2'

    const virtualDisk = ({ backing, key = 2000 }) => ({
      attributes: { 'xsi:type': 'VirtualDisk' },
      key,
      capacityInKB: CAPACITY / 1024,
      backing,
    })

    // a VM whose active disk is `ACTIVE`, snapshotted while it was using `BASE`
    const cbtResponses = ({
      changedArea = [{ start: 0, length: 65536 }],
      changeId = CHANGE_ID,
      powerState = 'poweredOff',
      queryChangedDiskAreas,
    } = {}) => {
      const properties = {
        'VirtualMachine:config.hardware.device': {
          attributes: { 'xsi:type': 'ArrayOfVirtualDevice' },
          VirtualDevice: [
            // a controller, which is a device but not a disk
            { attributes: { 'xsi:type': 'VirtualLsiLogicController' }, key: 1000 },
            virtualDisk({ backing: { fileName: ACTIVE, parent: { fileName: BASE } } }),
          ],
        },
        'VirtualMachine:runtime.powerState': { $value: powerState },
        'VirtualMachine:snapshot': {
          currentSnapshot: moRef('VirtualMachineSnapshot', 'snapshot-2'),
          rootSnapshotList: [
            {
              snapshot: moRef('VirtualMachineSnapshot', 'snapshot-1'),
              // the tree is walked, the disk of a child can be the one which was imported
              childSnapshotList: [{ snapshot: moRef('VirtualMachineSnapshot', 'snapshot-2') }],
            },
          ],
        },
        // the snapshot holds the disks as they were when it was taken: `BASE`, and its changeId
        'VirtualMachineSnapshot:snapshot-1:config.hardware.device': {
          VirtualDevice: [virtualDisk({ backing: { fileName: '[ds main] a.vm/other.vmdk' } })],
        },
        'VirtualMachineSnapshot:snapshot-2:config.hardware.device': {
          // `null` stands for a disk which was not tracked when it was snapshotted: it carries no
          // changeId at all
          VirtualDevice: [
            virtualDisk({ backing: changeId === null ? { fileName: BASE } : { changeId, fileName: BASE } }),
          ],
        },
      }

      return {
        RetrievePropertiesEx: ({ specSet }) => {
          const { type, pathSet } = specSet[0].propSet[0]
          const id = specSet[0].objectSet[0].obj.$value
          const val = properties[`${type}:${id}:${pathSet[0]}`] ?? properties[`${type}:${pathSet[0]}`]
          if (val === undefined) {
            // a property the object does not carry is simply absent from the answer
            return page([{ obj: moRef(type, id), propSet: [] }])
          }
          return page([{ obj: moRef(type, id), propSet: [{ name: pathSet[0], val }] }])
        },
        QueryChangedDiskAreas:
          queryChangedDiskAreas ?? (() => ({ returnval: { startOffset: 0, length: CAPACITY, changedArea } })),
      }
    }

    const cbtEsxi = async options => {
      const { esxi, vimClient } = await connectedEsxi({
        responses: cbtResponses(options),
        // both fallbacks fail fast: what a CBT test asserts on is what the host was asked, and a
        // fallback which reaches the network would answer with a DNS failure a few seconds later
        fetch: async () => response({ status: 206, body: 'not a vmdk descriptor' }),
      })
      // the vddk and the metadata reading must never be reached by a successful CBT query
      esxi.getServerThumbprint = failingThumbprint
      return { esxi, vimClient }
    }

    it('asks the host for the blocks changed since the disk which was already imported', async function () {
      const { esxi, vimClient } = await cbtEsxi({
        changedArea: [
          { start: 0, length: 65536 },
          { start: 3 * 65536, length: 2 * 65536 },
        ],
      })

      const dataMap = await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', {
        baseDiskPath: 'a.vm/vm.vmdk',
      })

      assert.deepEqual(dataMap, [
        { offset: 0, length: 65536, type: 0 },
        { offset: 3 * 65536, length: 2 * 65536, type: 0 },
      ])

      const queries = vimClient.callsTo('QueryChangedDiskAreas')
      assert.equal(queries.length, 1)
      // the deviceKey is resolved from the file the caller already names, and the changeId from
      // the snapshot which was using the disk of the previous import
      assert.deepEqual(queries[0].args, {
        _this: 'vm-1',
        deviceKey: 2000,
        startOffset: 0,
        changeId: CHANGE_ID,
      })
    })

    it('names the snapshot to read when the VM is running', async function () {
      const { esxi, vimClient } = await cbtEsxi({ powerState: 'poweredOn' })

      await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' })

      // without it the host answers the same FileFault as a disk which is not tracked at all
      assert.deepEqual(Object.keys(vimClient.callsTo('QueryChangedDiskAreas')[0].args), [
        '_this',
        'snapshot',
        'deviceKey',
        'startOffset',
        'changeId',
      ])
      assert.deepEqual(
        vimClient.callsTo('QueryChangedDiskAreas')[0].args.snapshot,
        moRef('VirtualMachineSnapshot', 'snapshot-2')
      )
    })

    it('asks again until the answers cover the whole disk', async function () {
      const half = CAPACITY / 2
      const { esxi, vimClient } = await cbtEsxi({
        queryChangedDiskAreas: ({ startOffset }) => ({
          returnval: {
            startOffset,
            length: half,
            changedArea: [{ start: startOffset, length: 65536 }],
          },
        }),
      })

      const dataMap = await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', {
        baseDiskPath: 'a.vm/vm.vmdk',
      })

      assert.equal(vimClient.callsTo('QueryChangedDiskAreas').length, 2)
      assert.deepEqual(
        vimClient.callsTo('QueryChangedDiskAreas').map(({ args }) => args.startOffset),
        [0, half]
      )
      assert.deepEqual(dataMap, [
        { offset: 0, length: 65536, type: 0 },
        { offset: half, length: 65536, type: 0 },
      ])
    })

    it('reports a disk which did not change as an empty map, not as a failure', async function () {
      // a delta of nothing is a legitimate answer: falling back here would read the whole disk
      const { esxi, vimClient } = await cbtEsxi({ changedArea: [] })

      assert.deepEqual(
        await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' }),
        []
      )
      assert.equal(vimClient.callsTo('QueryChangedDiskAreas').length, 1)
    })

    it('falls back when no snapshot recorded a changeId for the disk of the previous import', async function () {
      const { esxi, vimClient } = await cbtEsxi({ changeId: null })

      // the vddk then the metadata reading, which has nothing to read from the fake responses
      await assert.rejects(
        esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' }),
        { code: 'NO_DATA_MAP' }
      )
      // the host was never asked: without a changeId there is nothing to ask
      assert.equal(vimClient.callsTo('QueryChangedDiskAreas').length, 0)
    })

    it('asks for every used block of the chain when there is nothing to compare to', async function () {
      const { esxi, vimClient } = await cbtEsxi()

      const dataMap = await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk')

      assert.deepEqual(dataMap, [{ offset: 0, length: 65536, type: 0 }])
      // the tracking of a disk is seeded from its parent when a snapshot is taken, so this is the
      // whole chain, not only the link being written
      assert.equal(vimClient.callsTo('QueryChangedDiskAreas')[0].args.changeId, '*')
    })

    it('names the snapshot which holds the state being read, not only the live disk', async function () {
      const { esxi, vimClient } = await cbtEsxi({ powerState: 'poweredOn' })

      // the pass which reads a running VM up to its last snapshot asks for the disk of that
      // snapshot, which is not the one the VM is writing to
      await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm.vmdk')

      const { args } = vimClient.callsTo('QueryChangedDiskAreas')[0]
      assert.deepEqual(args.snapshot, moRef('VirtualMachineSnapshot', 'snapshot-2'))
      assert.equal(args.changeId, '*')
    })

    it('reads the disk itself when nothing can describe a whole disk', async function () {
      const fetched = []
      const { esxi } = await connectedEsxi({
        fetch: async url => {
          fetched.push(url.pathname)
          return response({ status: 206, body: 'not a vmdk descriptor' })
        },
      })
      esxi.getServerThumbprint = failingThumbprint

      // the vddk and the metadata reading both describe a single link of the chain: handing one
      // over as the map of a whole disk would drop everything its parents hold
      assert.equal(await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk'), undefined)
      assert.deepEqual(fetched, [])
    })

    it('reads what it is addressed by once for every disk of a VM', async function () {
      const { esxi, vimClient } = await cbtEsxi()

      const changeTracking = await esxi.getChangeTracking('vm-1')
      // the devices, the power state, the snapshot tree, then the devices of the two snapshots
      const reads = vimClient.callsTo('RetrievePropertiesEx').length
      assert.equal(reads, 5)

      await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { changeTracking })
      await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { changeTracking })

      // none of it is per disk: resolving it per disk used to issue the same calls, at the same
      // time, once per disk of the VM
      assert.equal(vimClient.callsTo('RetrievePropertiesEx').length, reads)
      assert.equal(vimClient.callsTo('QueryChangedDiskAreas').length, 2)
    })

    it('refuses a map which does not fit the disk', async function () {
      const { esxi } = await cbtEsxi({
        changedArea: [
          { start: 0, length: 2 * 65536 },
          // overlaps the previous one: read out of order, `NbdDisk` would throw mid-transfer
          { start: 65536, length: 65536 },
        ],
      })

      await assert.rejects(
        esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' }),
        { code: 'NO_DATA_MAP' }
      )
    })

    it('refuses an answer which does not move forward', async function () {
      const { esxi, vimClient } = await cbtEsxi({
        // a host answering a zero length would otherwise be asked until the cap
        queryChangedDiskAreas: () => ({ returnval: { startOffset: 0, length: 0, changedArea: [] } }),
      })

      await assert.rejects(
        esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk', { baseDiskPath: 'a.vm/vm.vmdk' }),
        { code: 'NO_DATA_MAP' }
      )
      assert.equal(vimClient.callsTo('QueryChangedDiskAreas').length, 1)
    })
  })
})
