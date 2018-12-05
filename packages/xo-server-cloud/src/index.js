import Client, { createBackoff } from 'jsonrpc-websocket-client'
import hrp from 'http-request-plus'

const WS_URL = 'ws://localhost:9001'
const HTTP_URL = 'http://localhost:9002'

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

    const registerResource = ({ namespace }) =>
      this._registerResource(namespace)
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
    this._unsetRequestResource = this._xo.defineProperty(
      'requestResource',
      this._requestResource,
      this
    )

    const updater = (this._updater = new Client(WS_URL))
    const connect = () =>
      updater.open(createBackoff()).catch(error => {
        console.error('xo-server-cloud: fail to connect to updater', error)

        return connect()
      })
    updater.on('closed', connect).on('scheduledAttempt', ({ delay }) => {
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

    if (_namespace === undefined) {
      throw new Error(`${namespace} is not available`)
    }

    if (_namespace.registered || _namespace.pending) {
      throw new Error(`already registered for ${namespace}`)
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

    const { _token: token } = await this._getNamespaceCatalog(namespace)

    // 2018-03-20 Extra check: getResourceDownloadToken seems to be called without a token in some cases
    if (token === undefined) {
      throw new Error(`${namespace} namespace token is undefined`)
    }

    const downloadToken = await this._updater.call('getResourceDownloadToken', {
      token,
      id,
      version,
    })

    if (!downloadToken) {
      throw new Error('cannot get download token')
    }

    const response = await hrp(HTTP_URL, {
      headers: {
        Authorization: `Bearer ${downloadToken}`,
      },
    })

    // currently needed for XenApi#putResource()
    response.length = response.headers['content-length']

    return response
  }
}

export default opts => new XoServerCloud(opts)
