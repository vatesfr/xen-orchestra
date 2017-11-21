import Client, { createBackoff } from 'jsonrpc-websocket-client'
import eventToPromise from 'event-to-promise'
import request from 'superagent'
import { PassThrough } from 'stream'

const UPDATER_URL = 'localhost'
const WS_PORT = 9001
const HTTP_PORT = 9002

// ===================================================================

class XoServerCloud {
  constructor ({ xo }) {
    this._xo = xo

    // Defined in configure().
    this._conf = null
    this._key = null
  }

  configure (configuration) {
    this._conf = configuration
  }

  async load () {
    const getResourceCatalog = () => this._getCatalog()
    getResourceCatalog.description = 'Get the list of all available resources'
    getResourceCatalog.permission = 'admin'

    const registerResource = ({ namespace }) => this._registerResource(namespace)
    registerResource.description = 'Register a resource via cloud plugin'
    registerResource.params = {
      namespace: {
        type: 'string',
      },
    }
    registerResource.permission = 'admin'

    this._unsetApiMethods = this._xo.addApiMethods({
      cloud: {
        getResourceCatalog,
        registerResource,
      },
    })
    this._unsetRequestResource = this._xo.defineProperty('requestResource', this._requestResource, this)

    const updater = this._updater = new Client(`${UPDATER_URL}:${WS_PORT}`)
    const connect = () => updater.open(createBackoff()).catch(
      error => {
        console.error('xo-server-cloud: fail to connect to updater', error)

        return connect()
      }
    )
    updater
      .on('closed', connect)
      .on('scheduledAttempt', ({ delay }) => {
        console.warn('xo-server-cloud: next attempt in %s ms', delay)
      })
    connect()
  }

  unload () {
    this._unsetApiMethods()
    this._unsetRequestResource()
  }

  // ----------------------------------------------------------------

  async _getCatalog () {
    const catalog = await this._updater.call('getResourceCatalog')

    if (!catalog) {
      throw new Error('cannot get catalog')
    }

    return catalog
  }

  // ----------------------------------------------------------------

  async _getNamespaces () {
    const catalog = await this._getCatalog()

    if (!catalog._namespaces) {
      throw new Error('cannot get namespaces')
    }

    return catalog._namespaces
  }

  // ----------------------------------------------------------------

  async _registerResource (namespace) {
    const _namespace = (await this._getNamespaces())[namespace]

    if (_namespace.registered || _namespace.pending) {
      return new Error(`already registered for ${namespace}`)
    }

    return this._updater.call('registerResource', { namespace })
  }

  // ----------------------------------------------------------------

  async _getNamespaceCatalog (namespace) {
    const namespaceCatalog = (await this._getCatalog())[namespace]

    if (!namespaceCatalog) {
      throw new Error(`cannot get catalog: ${namespace} not registered`)
    }

    return namespaceCatalog
  }

  // ----------------------------------------------------------------

  async _requestResource (namespace, id, version) {
    const _namespace = (await this._getNamespaces())[namespace]

    if (!_namespace || !_namespace.registered) {
      throw new Error(`cannot get resource: ${namespace} not registered`)
    }

    const namespaceCatalog = await this._getNamespaceCatalog(namespace)

    const downloadToken = await this._updater.call('getResourceDownloadToken', {
      token: namespaceCatalog._token,
      id,
      version,
    })

    if (!downloadToken) {
      throw new Error('cannot get download token')
    }

    const req = request.get(`${UPDATER_URL}:${HTTP_PORT}/`)
      .set('Authorization', `Bearer ${downloadToken}`)

    // Impossible to pipe the response directly: https://github.com/visionmedia/superagent/issues/1187
    const pt = new PassThrough()
    req.pipe(pt)
    pt.length = (await eventToPromise(req, 'response')).headers['content-length']

    return pt
  }
}

export default opts => new XoServerCloud(opts)
