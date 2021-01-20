import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import tmp from 'tmp'
import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { getHandler } from '@xen-orchestra/fs'
import { rmdir } from 'fs-extra'

import { debounceResource } from '../_debounceResource'
import { decorateResult } from '../_decorateResult'
import { deduped } from '../_deduped'

import { RemoteAdapter } from './backups/_RemoteAdapter'

function getDebouncedResource(resource) {
  return debounceResource(resource, this._app.hooks, this._app.config.getDuration('resourceDebounce'))
}

export default class Remotes {
  constructor(app) {
    this._app = app

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
          ({ remote }) =>
            using(this.getHandler(remote), handler => handler.test()).catch(error => ({
              success: false,
              error: error.message ?? String(error),
            })),
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
  async getHandler(remote) {
    const handler = getHandler(remote, this._app.config.get('remoteOptions'))

    if (!__DEV__ && handler.type === 'file') {
      throw new Error('Local remotes are disabled in proxies')
    }

    await handler.sync()
    return new Disposable(handler, () => handler.forget())
  }

  // FIXME: invalidate cache on remote option change
  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(Disposable.factory)
  *getAdapter(remote) {
    return new RemoteAdapter(yield this.getHandler(remote), { app: this._app })
  }

  async getTempMountDir() {
    const mountDir = await fromCallback(tmp.dir)
    return new Disposable(mountDir, () => rmdir(mountDir))
  }
}
