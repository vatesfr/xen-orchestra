import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { once } from 'node:events'

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
        return { status: 200, statusText: 'OK', headers: new Headers() }
      },
    })

    await esxi.download('ds main', 'vm/vm.vmdk', '0-511')

    const { url, options } = requests[0]
    assert.equal(url.host, 'esxi.test')
    assert.equal(url.pathname, '/folder/vm/vm.vmdk')
    assert.equal(url.searchParams.get('dsName'), 'ds main')
    assert.equal(url.searchParams.get('dcPath'), 'dc-main')
    assert.equal(options.headers.Range, 'bytes=0-511')
  })

  it('maps the datastores of every datacenter', async function () {
    const requested = []
    const { esxi } = await connectedEsxi({
      fetch: async url => {
        requested.push(url.searchParams.get('dcPath'))
        return { status: 200, statusText: 'OK', headers: new Headers() }
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
