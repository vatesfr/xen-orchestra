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

  const configResponse = vmPathName => `<FetchResponse><returnval>
    <name>a vm</name>
    <guestId>ubuntu64Guest</guestId>
    <guestFullName>Ubuntu Linux (64-bit)</guestFullName>
    <firmware>efi</firmware>
    <files><vmPathName>${vmPathName}</vmPathName></files>
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
   * @param {string} [options.vmPathName] - `files.vmPathName` reported for the VM
   * @param {number} [options.vmsdStatus] - status of the response to the vmsd request
   */
  const transferableEsxi = async ({ vmPathName = '[ds main] a.vm/a.vm.vmx', vmsdStatus = 404 } = {}) => {
    const requested = []
    const { esxi } = await connectedEsxi({
      responses: {
        // the datastores are listed through the property collector, the rest through `Fetch`
        RetrievePropertiesEx: ({ specSet }) =>
          specSet[0].propSet[0].type === 'Datastore' ? page(DATASTORE_SUMMARIES) : page(DATACENTERS),
      },
      fetch: async (url, options) => {
        if (options.method === 'POST') {
          return response({
            body: options.body.includes('runtime') ? RUNTIME_RESPONSE : configResponse(vmPathName),
          })
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

  it('reports a body which holds no readable fault', async function () {
    const { esxi } = await fetchPropertyEsxi(() => ({
      status: 503,
      statusText: 'Service Unavailable',
      // something in front of the host, not a vim25 fault
      text: async () => '<html><body>gateway is down</body></html>',
    }))

    await assert.rejects(esxi.fetchProperty('VirtualMachine', 'vm-42', 'config'), {
      code: 'NO_PROPERTY',
      message: "can't get config of object vm-42 (Type: VirtualMachine)",
    })
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

    const dataMap = await esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk')

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

    await assert.rejects(esxi.getDataMap('vm-1', 'ds main', 'a.vm/vm-000001.vmdk'), { code: 'NO_DATA_MAP' })
  })
})
