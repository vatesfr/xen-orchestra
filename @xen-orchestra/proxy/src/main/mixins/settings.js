import * as MessagePack from 'messagepack'

export default class Settings {
  constructor(app) {
    const table = app.db.createTable('settings', {
      setting: {
        type: 'text',
        // primaryKey: true,
      },
      value: 'blob',
    })

    this._get = table
      .select(['value'])
      .where('setting = ?')
      .prepare()
      .pluck()
    this._set = table.insert({ setting: '?', value: '?' }).prepare()
    // this._upsert = db.prepare(`
    //   INSERT INTO Objects VALUES(?, ?)
    //     ON CONFLICT(KEY) DO UPDATE SET value=excluded.value
    // `)
  }

  get(setting) {
    const result = this._get.get(setting)
    if (result !== undefined) {
      return MessagePack.decode(result)
    }
  }

  set(setting, value) {
    this._set.run(setting, MessagePack.encode(value))
  }
}
