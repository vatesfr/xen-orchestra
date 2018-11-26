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

    this._delete = table
      .delete()
      .where('setting = ?')
      .prepare()
    this._get = table
      .select(['value'])
      .where('setting = ?')
      .prepare()
      .pluck()
    this._set = table.insert({ setting: '?', value: '?' }).prepare()
    // this._upsert = db.prepare(`
    //   INSERT INTO settings VALUES(?, ?)
    //     ON CONFLICT(setting) DO UPDATE SET value=excluded.value
    // `)
  }

  delete(setting) {
    this._delete.run(setting)
  }

  get(setting) {
    const result = this._get.get(setting)
    if (result !== undefined) {
      return MessagePack.decode(result)
    }
  }

  set(setting, value) {
    if (Buffer.isBuffer(value)) {
      value = value.toString()
    }
    this._set.run(setting, MessagePack.encode(value))
  }
}
