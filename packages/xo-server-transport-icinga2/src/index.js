import assert from 'assert'
import { URL } from 'url'

// =============================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    server: {
      type: 'string',
      description: `
The icinga2 server http/https address.

*If no port is provided in the URL, 5665 will be used.*

Examples:
- https://icinga2.example.com
- http://192.168.0.1:1234
      `.trim(),
    },
    user: {
      type: 'string',
      description: 'The icinga2 server username',
    },
    password: {
      type: 'string',
      description: 'The icinga2 server password',
    },
    filter: {
      type: 'string',
      description: `
The filter to use

See: https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/#filters

Example:
- Monitor the backup jobs of the VMs of a specific host:

\`host.name=="xoa.example.com" && service.name=="xo-backup"\`
      `.trim(),
    },

    filters: {
      type: 'array',
      title: 'filters',
      description: `
an array of filters with id backup and icinga filter'

Example:
\`172f809e-5e1a-409e-a26e-95af840b81e1|host.name=="xoa.example.com" && service.name=="xo-backup"\`
      `.trim(),

      items: {
        type: 'string',
      },
      minItems: 1,

    },

    acceptUnauthorized: {
      type: 'boolean',
      description: 'Accept unauthorized certificates',
      default: false,
    },
  },
  additionalProperties: false,
  required: ['server'],
}

// =============================================================================

const STATUS_MAP = {
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
  UNKNOWN: 3,
}

// =============================================================================

class XoServerIcinga2 {
  constructor({ xo }) {
    this._xo = xo
  }

  // ---------------------------------------------------------------------------

  configure(configuration) {
    const serverUrl = new URL(configuration.server)
    if (configuration.user !== '') {
      serverUrl.username = configuration.user
    }
    if (configuration.password !== '') {
      serverUrl.password = configuration.password
    }
    if (serverUrl.port === '') {
      serverUrl.port = '5665' // Default icinga2 access port
    }
    serverUrl.pathname = '/v1/actions/process-check-result'
    this._url = serverUrl.href

    //
    this._filters = configuration.filters
    //

    this._filter = configuration.filter !== undefined ? configuration.filter : ''
    this._acceptUnauthorized = configuration.acceptUnauthorized
  }

  load() {
    this._unset = this._xo.defineProperty('sendIcinga2Status', this._sendIcinga2Status, this)
  }

  unload() {
    this._unset()
  }

  test() {
    return this._sendIcinga2Status({
      message: 'The server-icinga2 plugin for Xen Orchestra server seems to be working fine, nicely done :)',
      status: 'OK',
    })
  }

  // ---------------------------------------------------------------------------

  _sendIcinga2Status({ message, status }) {
    const icinga2Status = STATUS_MAP[status]
    assert(icinga2Status !== undefined, `Invalid icinga2 status: ${status}`)
    var id_backup = ""
    var result
    var filter_split
    var filter_id_backup
    var filter
    result = message.indexOf("**Job ID**:")
    result = result + 12
    id_backup = message.substr(result, 36)

    if (!(this._filters === undefined || this._filters.length === 0)) {
        for (let i=0; i < this._filters.length; i++) {
            filter_split = this._filters[i].split("|");
            if(filter_split.length == 2 && filter_split[0] == id_backup){
                filter_id_backup = filter_split[0]
                filter = filter_split[1]
                break
            } else {
                filter_id_backup = ""
                filter = ""
            }
        }
    }

    if ( filter_id_backup && filter && id_backup ) {
        this._filter = filter
    }


    return this._xo
      .httpRequest(this._url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        rejectUnauthorized: !this._acceptUnauthorized,
        body: JSON.stringify({
          type: 'Service',
          filter: this._filter,
          plugin_output: message,
          exit_status: icinga2Status,
        }),
      })
      .then(response => response.text())
  }
}

// =============================================================================

export default opts => new XoServerIcinga2(opts)
