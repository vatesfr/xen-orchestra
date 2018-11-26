import expect from 'expect'
import SqliteDatabase from 'better-sqlite3'
import uuid from 'uuid/v4'
import { join } from 'path'

// https://www.sqlite.org/lang_expr.html
const escapeIdentifier = ident => `"${ident.replace(/"/, '""')}"`
const escapeValue = val =>
  typeof val === 'string' ? `'${val.replace(/'/, "''")}'` : String(val)

class Delete {
  constructor(table) {
    this._table = table
  }

  prepare() {
    const table = this._table
    const where = this._where
    const sql = ['DELETE FROM', escapeIdentifier(table._name)]
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

class Insert {
  constructor(table, columns) {
    this._columns = columns
    this._table = table

    if (!('id' in columns)) {
      columns.id = 'uuid_generate_v4()'
    }
  }

  prepare() {
    const columns = this._columns
    const columnNames = Object.keys(columns)
    const table = this._table
    return table._db.prepare(
      [
        'INSERT INTO',
        escapeIdentifier(table._name),
        '(',
        columnNames.map(escapeIdentifier).join(', '),
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
        : columns.map(escapeIdentifier).join(', '),
      'FROM',
      escapeIdentifier(table._name),
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
      escapeIdentifier(table._name),
      'SET',
      Object.keys(columns)
        .map(name => `${escapeIdentifier(name)} = ${columns[name]}`)
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

    this.getFromRowid = db.prepare(
      `SELECT * FROM ${escapeIdentifier(name)} WHERE rowid = ?`
    )
  }

  delete(...args) {
    return new Delete(this, ...args)
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
  constructor(
    app,
    {
      config: { datadir },
    }
  ) {
    const db = (this._db = new SqliteDatabase(join(datadir, 'sqlite3.db')))
    app.hooks.on('stop', db.close.bind(db)).on('clean', () => db.exec('VACUUM'))
    db.function('uuid_generate_v4', () => uuid())
  }

  createTable(name, columns) {
    expect(typeof name).toBe('string')
    expect(columns).not.toBe(null)
    expect(typeof columns).toBe('object')

    const sql = [
      'CREATE TABLE IF NOT EXISTS',
      escapeIdentifier(name),
      '(',
      'id TEXT NOT NULL,',
      'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
      'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ]
    Object.keys(columns).forEach(name => {
      sql.push(',', escapeIdentifier(name))
      const column = columns[name]
      if (typeof column === 'string') {
        return sql.push(column)
      }
      sql.push(column.type)
      if (!column.optional) {
        sql.push('NOT NULL')
      }
      const defaultValue = column.default
      if (defaultValue !== undefined) {
        sql.push('DEFAULT', escapeValue(defaultValue))
      }
      if (column.primaryKey) {
        sql.push('PRIMARY KEY')
      }
      const enumValues = column.enum
      if (enumValues !== undefined) {
        sql.push(
          'CHECK (',
          escapeIdentifier(name),
          'IN (',
          enumValues.map(escapeValue).join(','),
          '))'
        )
      }
    })
    sql.push(
      ');',
      'CREATE TRIGGER IF NOT EXISTS',
      escapeIdentifier(`${name}_updated_at`),
      'AFTER UPDATE ON',
      escapeIdentifier(name),
      'FOR EACH ROW BEGIN UPDATE',
      escapeIdentifier(name),
      'SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;',
      'END;'
    )

    const db = this._db
    db.exec(sql.join(' '))

    return new Table(db, name)
  }
}
