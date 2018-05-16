import Worker from 'jest-worker'

export default class Workers {
  get worker() {
    return this._worker
  }

  constructor(app, { config }) {
    app.on('start', () => {
      process.env.XO_CONFIG = JSON.stringify(config)

      this._worker = new Worker(require.resolve('../../worker'))
    })
    app.on('stop', () => this._worker.end())
  }
}
