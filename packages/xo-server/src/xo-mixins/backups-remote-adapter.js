import Disposable from 'promise-toolbox/Disposable'

import { compose } from '@vates/compose'
import { decorateWith } from '@vates/decorate-with'
import { deduped } from '@vates/disposable/deduped'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter'

export default class BackupsRemoteAdapter {
  constructor(app, { backup }) {
    this._app = app
    this._config = backup
  }

  // FIXME: invalidate cache on remote option change
  @decorateWith(compose, function (resource) {
    return this._app.debounceResource(resource)
  })
  @decorateWith(deduped, remote => [remote.url])
  @decorateWith(Disposable.factory)
  async getBackupsRemoteAdapter(remote) {
    const app = this._app
    return new RemoteAdapter(await app.getRemoteHandler(remote), {
      debounceResource: app.debounceResource.bind(app),
      dirMode: this._config.dirMode,
    })
  }
}
