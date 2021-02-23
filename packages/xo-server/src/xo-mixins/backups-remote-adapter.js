import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter'

export default class BackupsRemoteAdapter {
  constructor(app, { backup }) {
    this._app = app
    this._config = backup
  }

  async getBackupsRemoteAdapter(remote) {
    const app = this._app
    return new RemoteAdapter(await app.getRemoteHandler(remote), {
      debounceResource: app.debounceResource.bind(app),
      dirMode: this._config.dirMode,
    })
  }
}
