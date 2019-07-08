export default class Backups {
  constructor(app) {
    app.addApiMethods({
      backup: {
        _run,
      },
    })
  }
}
