import LevelDbLogger from './loggers/leveldb'

const STORE_NAMESPACE = 'logs'

export default class Logs {
  constructor(app, { nKeptLogs }) {
    this._app = app

    app.on('clean', () =>
      app.getStore(STORE_NAMESPACE).then(db => db.gc(nKeptLogs))
    )
  }

  getLogger(namespace) {
    return this._app
      .getStore(STORE_NAMESPACE)
      .then(store => new LevelDbLogger(store, namespace))
  }

  getLogs(namespace) {
    return this.getLogger(namespace).then(db => db.getAll())
  }
}
