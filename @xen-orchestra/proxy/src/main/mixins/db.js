import * as MessagePack from 'messagepack'
import assert from 'assert'
import SqliteDatabase from 'better-sqlite3'
import { join } from 'path'

export default class Database {
  get db() {
    return this._db
  }

  constructor(
    app,
    {
      config: { datadir },
    }
  ) {
    const db = (this._db = new SqliteDatabase(join(datadir, 'sqlite3.db')))
    db.exec(`
        CREATE TABLE IF NOT EXISTS Objects (
          key TEXT NOT NULL PRIMARY KEY,
          value BLOB
        )
      `)
    app.on('stop', db.close.bind(db))

    this._select = db.prepare('SELECT value FROM Objects WHERE key=?').pluck()
    this._upsert = db.prepare(`
      INSERT INTO Objects VALUES(?, ?)
        ON CONFLICT(KEY) DO UPDATE SET value=excluded.value
    `)
  }

  get(key) {
    const result = this._select.get(key)
    if (result !== undefined) {
      return MessagePack.decode(result)
    }
  }

  put(key, value) {
    assert.strictEqual(typeof key, 'string')
    this._upsert.run(key, MessagePack.encode(value))
  }
}
