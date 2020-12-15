import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import tmp from 'tmp'
import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { getHandler } from '@xen-orchestra/fs'
import { parseDuration } from '@vates/parse-duration'
import { rmdir } from 'fs-extra'

import { debounceResource } from '../_debounceResource'
import { decorateResult } from '../_decorateResult'
import { deduped } from '../_deduped'
import { disposable } from '../_disposable'

import { RemoteAdapter } from './backups/_RemoteAdapter'

function getDebouncedResource(resource) {
  return debounceResource(resource, this._app.hooks, parseDuration(this._config.resourceDebounce))
}

export default class Remotes {
  constructor(app, { config }) {
    this._app = app
    this._config = config

    app.api.addMethods({
      remote: {
        getInfo: [
          ({ remote }) => using(this.getHandler(remote), handler => handler.getInfo()),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],

        test: [
          ({ remote }) => using(this.getHandler(remote), handler => handler.test()),
          {
            params: {
              remote: { type: 'object' },
            },
          },
        ],
      },
    })
  }

  // FIXME: invalidate cache on remote option change
  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(disposable)
  async *getHandler(remote) {
    const handler = getHandler(remote, this._config.remoteOptions)
    await handler.sync()
    try {
      yield handler
    } finally {
      await handler.forget()
    }
  }

  // FIXME: invalidate cache on remote option change
  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(disposable)
  *getAdapter(remote) {
    return new RemoteAdapter(yield this.getHandler(remote), {
      app: this._app,
      config: this._config,
    })
  }

  async getTempMountDir() {
    const mountDir = await fromCallback(tmp.dir)
    return new Disposable(mountDir, () => rmdir(mountDir))
  }
}
