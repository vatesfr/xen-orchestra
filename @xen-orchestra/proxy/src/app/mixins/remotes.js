import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { getHandler } from '@xen-orchestra/fs'

import { RemoteAdapter } from './backups/_RemoteAdapter'

import { deduped } from './_deduped'
import { disposable } from './_disposable'

export default class Remotes {
  constructor(app, { config: { remoteOptions } }) {
    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) =>
            using(this.getHandler(remote, remoteOptions), handler =>
              handler.getInfo()
            ),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        test: [
          ({ remote }) =>
            using(this.getHandler(remote, remoteOptions), handler =>
              handler.test()
            ),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],
      },
    })
  }

  @decorateWith(deduped, remote => [remote.url], function () {
    return this._config.resourceDebounce
  })
  @decorateWith(disposable)
  async *getHandler(remote, options) {
    const handler = getHandler(remote, options)
    await handler.sync()
    try {
      yield handler
    } finally {
      await handler.forget()
    }
  }

  @decorateWith(deduped, remote => [remote.url], function () {
    return this._config.resourceDebounce
  })
  @decorateWith(disposable)
  *getAdapter(remote) {
    return new RemoteAdapter(yield this.getHandler(remote))
  }
}
