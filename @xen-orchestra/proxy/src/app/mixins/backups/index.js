import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { createLogger } from '@xen-orchestra/log/dist'
import { getHandler } from '@xen-orchestra/fs/dist'
import { Xapi } from '@xen-orchestra/xapi'

import { Backup } from './_Backup'
import { RemoteAdapter } from './_RemoteAdapter'

const { warn } = createLogger('xo:proxy:backups')

export default class Backups {
  constructor(
    app,
    { config: { backups: config, xapiOptions: globalXapiOptions } }
  ) {
    app.api.addMethods({
      backup: {
        listVmBackups: [
          async ({ remotes }) => {
            const backups = {}
            await Promise.all(
              Object.keys(remotes).map(async remoteId => {
                try {
                  const handler = getHandler(remotes[remoteId])
                  await handler.sync()
                  try {
                    const adapter = new RemoteAdapter(handler)
                    backups[remoteId] = await adapter.listAllVmBackups()
                  } finally {
                    await handler.forget()
                  }
                } catch (error) {
                  warn('listVmBackups', { error, remote: remotes[remoteId] })
                }
              })
            )
            return backups
          },
          {
            description: 'list VM backups',
            params: {
              remotes: {
                type: 'array',
                items: { type: 'object', properties: {} },
              },
            },
          },
        ],
        run: [
          async ({ xapis: xapisOptions, ...rest }) => {
            const xapis = []
            async function createConnectedXapi(id) {
              const {
                credentials: { username: user, password },
                ...xapiOptions
              } = xapisOptions[id]
              const xapi = new Xapi({
                ...globalXapiOptions,
                ...xapiOptions,
                auth: {
                  user,
                  password,
                },
              })
              xapis.push(xapi)
              await xapi.connect()
              await xapi.objectsFetched
              return xapi
            }
            async function disconnectAllXapis() {
              const promises = xapis.map(xapi => xapi.disconnect())
              xapis.length = 0
              await Promise.all(promises)
            }
            app.hooks.on('stop', disconnectAllXapis)

            const connectedXapis = { __proto__: null }
            function getConnectedXapi(id) {
              let connectedXapi = connectedXapis[id]
              if (connectedXapi === undefined) {
                connectedXapi = createConnectedXapi(id)
                connectedXapis[id] = connectedXapi
              }
              return connectedXapi
            }

            try {
              await new Backup({
                ...rest,
                config,
                getConnectedXapi,
              }).run()
            } finally {
              app.hooks.removeListener('stop', disconnectAllXapis)
              ignoreErrors.call(disconnectAllXapis())
            }
          },
          {
            description: 'run a backup job',
            params: {
              job: { type: 'object' },
              remotes: { type: 'object' },
              schedule: { type: 'object' },
              xapis: { type: 'object' },
              recordToXapi: { type: 'object' },
            },
          },
        ],
      },
    })
  }
}
