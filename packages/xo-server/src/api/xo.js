import { streamToBuffer } from '../utils'

// ===================================================================

export function clean () {
  return this.clean()
}

clean.permission = 'admin'

// -------------------------------------------------------------------

export async function exportConfig () {
  return {
    $getFrom: await this.registerHttpRequest((req, res) => {
      res.writeHead(200, 'OK', {
        'content-disposition': 'attachment',
      })

      return this.exportConfig()
    },
    undefined,
    { suffix: '/config.json' }),
  }
}

exportConfig.permission = 'admin'

// -------------------------------------------------------------------

export function getAllObjects ({ filter, limit }) {
  return this.getObjects({ filter, limit })
}

getAllObjects.permission = ''
getAllObjects.description = 'Returns all XO objects'

getAllObjects.params = {
  filter: { type: 'object', optional: true },
  limit: { type: 'number', optional: true },
}

// -------------------------------------------------------------------

export async function importConfig () {
  return {
    $sendTo: await this.registerHttpRequest(async (req, res) => {
      await this.importConfig(JSON.parse(await streamToBuffer(req)))

      res.end('config successfully imported')
    }),
  }
}

importConfig.permission = 'admin'
