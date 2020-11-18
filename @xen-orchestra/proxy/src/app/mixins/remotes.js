import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { getHandler } from '@xen-orchestra/fs'

import { debounceResource } from '../_debounceResource'
import { decorateResult } from '../_decorateResult'
import { deduped } from '../_deduped'
import { disposable } from '../_disposable'
import { disposeResourceOnStop } from '../_disposeResourceOnStop'

import { RemoteAdapter } from './backups/_RemoteAdapter'

export default class Remotes {
  constructor(app, { config }) {
    this._app = app
    this._config = config

    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) =>
            using(this.getHandler(remote, config.remoteOptions), handler =>
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
            using(this.getHandler(remote, config.remoteOptions), handler =>
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

  @decorateResult(debounceResource, function () {
    return this._config.resourceDebounce
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateResult(disposeResourceOnStop, function () {
    return this._app.hooks
  })
  @decorateResult(disposable)
  async *getHandler(remote, options) {
    const handler = getHandler(remote, options)
    await handler.sync()
    try {
      yield handler
    } finally {
      await handler.forget()
    }
  }

  @decorateResult(debounceResource, function () {
    return this._config.resourceDebounce
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateResult(disposeResourceOnStop, function () {
    return this._app.hooks
  })
  @decorateResult(disposable)
  *getAdapter(remote) {
    return new RemoteAdapter(yield this.getHandler(remote))
  }
}
