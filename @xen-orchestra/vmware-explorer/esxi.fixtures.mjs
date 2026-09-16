// helpers shared by the unit tests and the integration tests of the client
import { once } from 'node:events'

import Esxi from './esxi.mjs'
import { moRef } from './soap/specs.mjs'

// re-exported: building the fixtures with the same helper as the production code means they cannot
// drift from the shape the tests are supposed to assert on
export { moRef }

// a page of a RetrievePropertiesEx response
export const page = (objects, token) => ({ returnval: { objects, token } })

// two datacenters and three datastores, shaped as the SOAP library returns them
export const DATACENTERS = [
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

export const DATASTORES = [
  // a single property is not wrapped in an array either
  { obj: moRef('Datastore', 'datastore-11'), propSet: { name: 'name', val: { $value: 'ds main' } } },
  { obj: moRef('Datastore', 'datastore-12'), propSet: [{ name: 'name', val: { $value: 'ds2' } }] },
  { obj: moRef('Datastore', 'datastore-21'), propSet: [{ name: 'name', val: { $value: 'ds3' } }] },
]

export const INVENTORY_RESPONSES = {
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
export class FakeVimClient {
  constructor(responses = INVENTORY_RESPONSES) {
    this.calls = []
    this.responses = responses
    this.serviceContent = {
      propertyCollector: moRef('PropertyCollector', 'propertyCollector'),
      rootFolder: moRef('Folder', 'group-d1'),
      viewManager: moRef('ViewManager', 'ViewManager'),
    }
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
export const response = ({ status = 200, statusText = 'OK', headers = {}, body = '' } = {}) => {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body)
  return {
    status,
    statusText,
    headers: new Headers({ 'content-length': String(buffer.length), ...headers }),
    body: { cancel: async () => {} },
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    text: async () => buffer.toString('utf8'),
  }
}

/** connects with the inventory above, then hands the client over to the test */
export const connectedEsxi = async ({ responses, ...options } = {}) => {
  const vimClient = new FakeVimClient()
  const esxi = new Esxi('esxi.test', 'user', 'password', true, { ...options, vimClient })
  await once(esxi, 'ready')

  if (responses !== undefined) {
    vimClient.responses = { ...INVENTORY_RESPONSES, ...responses }
  }
  vimClient.calls.length = 0

  return { esxi, vimClient }
}
