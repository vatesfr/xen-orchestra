import { getHandler } from '@xen-orchestra/fs'

export default class Remotes {
  constructor(app, { remoteOptions }) {
    this._remoteOptions = remoteOptions

    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) =>
            this._doWithHandler(remote, handler => handler.getInfo()),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        test: [
          ({ remote }) =>
            this._doWithHandler(remote, handler => handler.test()),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],
      },
    })
  }

  async _doWithHandler(remote, cb) {
    const handler = getHandler(remote, this._remoteOptions)
    await handler.sync()
    try {
      return await cb(handler)
    } finally {
      await handler.forget()
    }
  }
}
