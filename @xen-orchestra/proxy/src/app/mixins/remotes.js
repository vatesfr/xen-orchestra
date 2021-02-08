import Disposable from 'promise-toolbox/Disposable'
import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { getHandler } from '@xen-orchestra/fs'

import { debounceResource } from '../_debounceResource'
import { decorateResult } from '../_decorateResult'
import { deduped } from '../_deduped'

import { RemoteAdapter } from './backups/_RemoteAdapter'

function getDebouncedResource(resource) {
  const app = this._app
  return debounceResource(resource, app.backups.addDisposeListener, app.config.getDuration('resourceDebounce'))
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
    const app = this._app
    return new RemoteAdapter(yield this.getHandler(remote), {
      addDisposeListener: app.backups.addDisposeListener,
      app,
    })
  }
}
