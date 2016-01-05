export const configurationSchema = {
  type: 'object',

  properties: {
    emails: {
      type: 'array',
      items: {
        type: 'string'
      }
    },

    periodicity: {
      enum: [ 'weekly', 'monthly' ]
    }
  },

  additionalProperties: false,
  required: [ 'emails', 'periodicity' ]
}

// ===================================================================

class UsageReportPlugin {
  constructor (xo) {
    this._xo = xo
    this._unset = null
  }

  configure () {
    // TODO
  }

  load () {
    // TODO
    this._unset = this._xo.api.addMethod('generateUsageReport', () => {
      return 'toto'
    })
  }

  unload () {
    this._unset()
  }
}

// ===================================================================

export default ({ xo }) => new UsageReportPlugin(xo)
