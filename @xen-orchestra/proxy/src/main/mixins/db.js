import expect from 'expect'
import SqliteDatabase from 'better-sqlite3'
import { join } from 'path'

// https://www.sqlite.org/lang_expr.html
const escapeString = str => `'${str.replace(/'/, "''")}'`

class Insert {
  constructor(table, columns) {
    this._columns = columns
    this._table = table
  }

  prepare() {
    const columns = this._columns
    const columnNames = Object.keys(columns)
    const table = this._table
    return table._db.prepare(
      [
        'INSERT INTO',
        escapeString(table._name),
        '(',
        columnNames.map(escapeString).join(', '),
        ') VALUES (',
        columnNames.map(name => columns[name]).join(', '),
        ')',
      ].join(' ')
    )
  }
}

class Select {
  constructor(table, columns) {
    this._columns = columns
    this._table = table
    this._where = undefined
  }

  prepare() {
    const columns = this._columns
    const table = this._table
    const where = this._where
    const sql = [
      'SELECT',
      columns === undefined || columns.length === 0
        ? '*'
        : columns.map(escapeString).join(', '),
      'FROM',
      escapeString(table._name),
    ]
    if (where !== undefined) {
      sql.push('WHERE', where)
    }
    return table._db.prepare(sql.join(' '))
  }

  where(clause) {
    expect(this._where).toBe(undefined)
    this._where = clause
    return this
  }
}

class Update {
  constructor(table, columns) {
    this._columns = columns
    this._table = table
    this._where = undefined
  }

  prepare() {
    const columns = this._columns
    const table = this._table
    const where = this._where
    const sql = [
      'UPDATE',
      escapeString(table._name),
      'SET',
      Object.keys(columns)
        .map(name => `${escapeString(name)} = ${columns[name]}`)
        .join(','),
    ]
    if (where !== undefined) {
      sql.push('WHERE', where)
    }
    return table._db.prepare(sql.join(' '))
  }

  where(clause) {
    expect(this._where).toBe(undefined)
    this._where = clause
    return this
  }
}

class Table {
  constructor(db, name) {
    this._db = db
    this._name = name
  }

  insert(...args) {
    return new Insert(this, ...args)
  }

  select(...args) {
    return new Select(this, ...args)
  }

  update(...args) {
    return new Update(this, ...args)
  }
}

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
    app.on('stop', db.close.bind(db))
  }

  createTable(name, columns) {
    expect(typeof name).toBe('string')
    expect(columns).not.toBe(null)
    expect(typeof columns).toBe('object')

    const sql = [
      'CREATE TABLE IF NOT EXISTS',
      escapeString(name),
      '(',
      'id INTEGER PRIMARY KEY AUTOINCREMENT,',
      'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
      'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ]
    Object.keys(columns).forEach(name => {
      sql.push(',', escapeString(name))
      const column = columns[name]
      if (typeof column === 'string') {
        return sql.push(column)
      }
      sql.push(column.type)
      if (!column.optional) {
        sql.push('NOT NULL')
      }
      if (column.primaryKey) {
        sql.push('PRIMARY KEY')
      }
    })
    sql.push(
      ');',
      'CREATE TRIGGER IF NOT EXISTS',
      escapeString(`${name}_updated_at`),
      'AFTER UPDATE ON',
      escapeString(name),
      'FOR EACH ROW BEGIN UPDATE',
      escapeString(name),
      'SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;',
      'END;'
    )

    const db = this._db
    db.exec(sql.join(' '))

    return new Table(db, name)
  }
}
