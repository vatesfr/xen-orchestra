import assert from 'node:assert'
import { Client, escapeIdentifier, escapeLiteral, Pool } from 'pg'
import { rows2Columns } from './db.mjs'
import { UUID_TYPE } from './types.mjs'

/**
 * @param xapiDbClass
 * @param updatableFieldNames those field names will get an 'UPDATE SET' conflict action
 * @param columns the columns present in the records
 * @param records
 * @return {{sql: string, bind: []}}
 */
export function createInsert(xapiDbClass, updatableFieldNames, columns, records) {
  const updateClause = updatableFieldNames
    .map(f => `${escapeIdentifier(f)} = EXCLUDED.${escapeIdentifier(f)}`)
    .join(', ')
  const bind = rows2Columns(records, columns)
  const bindNames = Object.keys(bind)
  const sqlColumns = columns.map(c => {
    const index = bindNames.indexOf(c) + 1
    return `$${index}::${xapiDbClass.getField(c).sequelizeDef.type}[]`
  })
  const conflictAction = updateClause.length > 0 ? `UPDATE SET ${updateClause}` : `NOTHING`
  const sql = `
        INSERT INTO ${xapiDbClass.getTableNameEsc()} (${columns.map(c => escapeIdentifier(c)).join(', ')})
                (SELECT * FROM UNNEST(${sqlColumns.join(', ')}))
        ON CONFLICT (uuid) DO ${conflictAction}`
  return { sql, bind: Object.values(bind) }
}

export class TableCreator {
  constructor(schema, name, comment) {
    this.schema = schema
    this.name = name
    this.comment = comment
    this.primaryKeyCols = []
    this.delayedDDL = []
    this.createTableColumns = []
    this.availableAtCreateColumns = new Set()
    this.indices = []
  }

  addColumn(colName, type, defaultValue, reference = null, comment = null) {
    const colEsc = escapeIdentifier(colName)
    const tableNameEsc = absRelationEsc(this.schema, this.name)
    if (reference) {
      const { schema, table, column, onUpdate, onDelete } = reference
      let alter = `ALTER TABLE ${tableNameEsc}
        ADD COLUMN IF NOT EXISTS ${colEsc} ${type} REFERENCES ${absReferenceEsc(schema, table, column)}`
      if (onUpdate) alter += ` ON UPDATE ${onUpdate}`
      if (onDelete) alter += ` ON DELETE ${onDelete}`
      this.delayedDDL.push(alter)
    } else {
      let sql = `${colEsc} ${type}`
      // it is not possible to prepare and bind a "CREATE TABLE" statement, so we have to escape the text of the default value
      if (defaultValue != null) sql += ` DEFAULT ${escapeLiteral(String(defaultValue))}`
      this.createTableColumns.push(sql)
      this.availableAtCreateColumns.add(colName)
    }
    if (comment) {
      this.delayedDDL.push(commentDDL('COLUMN', `${tableNameEsc}.${colEsc}`, comment))
    }
  }

  addPrimaryKey(colName) {
    this.primaryKeyCols.push(colName)
  }

  addIndex(indexName, colNames) {
    this.indices.push({ name: indexName, columns: colNames })
  }

  getDDL() {
    const primaryKeyClause = `PRIMARY KEY (${this.primaryKeyCols.map(c => escapeIdentifier(c)).join(', ')})`
    // the primary key columns might be reference fields, those are added later, so the primary key has to be added even later.
    // There are only 2 layers of dependencies: Xapi object tables and Set or Map tables pointing to those Xapi objects.
    // Xapi object tables always point directly to other Xapi object tables uuid column.
    const atCreationPrimaryKey =
      this.primaryKeyCols.length && this.primaryKeyCols?.every(col => this.availableAtCreateColumns.has(col))
    const delayedPrimaryKey = this.primaryKeyCols.length && !atCreationPrimaryKey
    const columDefs = [...this.createTableColumns]
    if (atCreationPrimaryKey) columDefs.push(primaryKeyClause)
    const tableEsc = absRelationEsc(this.schema, this.name)
    const create = `CREATE TABLE IF NOT EXISTS ${tableEsc} (${columDefs.join(', ')})`
    if (this.comment) this.delayedDDL.push(commentDDL('TABLE', tableEsc, this.comment))
    if (this.indices)
      for (const { name, columns } of this.indices) {
        this.delayedDDL.push(
          `CREATE INDEX IF NOT EXISTS ${escapeIdentifier(name)} ON ${tableEsc} (${columns.map(c => escapeIdentifier(c)).join(', ')});`
        )
      }
    // using delayed alter table because the targeted column might be added by a belated "alter table"
    if (delayedPrimaryKey)
      // https://stackoverflow.com/a/69511564
      // creating a fake 'ADD PRIMARY KEY ... IF NOT EXISTS'
      this.delayedDDL.push(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = '${tableEsc}'::regclass AND contype = 'p')
            THEN ALTER TABLE ${tableEsc} ADD ${primaryKeyClause}; END IF;
          END $$;`)
    return { immediate: [create], delayed: this.delayedDDL }
  }
}

export const absRelationEsc = (schema, tableName) => `${escapeIdentifier(schema)}.${escapeIdentifier(tableName)}`
export const absReferenceEsc = (schema, tableName, colName) =>
  `${absRelationEsc(schema, tableName)}(${escapeIdentifier(colName)})`

function commentDDL(type, identifierEsc, commentRaw) {
  assert.ok(identifierEsc.startsWith('"'), `identifier should have been double quoted, got: ${identifierEsc}`)
  // it is not possible to prepare and bind a "COMMENT ON" statement, so we have to escape the text
  return `COMMENT ON ${type} ${identifierEsc} IS ${escapeLiteral(commentRaw)}`
}

export function createViewDDL(cls, viewNameEsc, ddlStatementsCollector, commentStatementsCollector) {
  const columnsEsc = []
  const laterals = []
  for (const f of cls.fields) {
    const colNameEsc = escapeIdentifier(f.name)
    columnsEsc.push(f.viewExpressionEsc)
    laterals.push(f.viewLateral)
    commentStatementsCollector.push(commentDDL('COLUMN', `${viewNameEsc}.${colNameEsc}`, f.comment))
  }
  const projectionEsc = columnsEsc.join(', ')
  const statement = `
    CREATE OR REPLACE VIEW ${viewNameEsc} AS SELECT ${projectionEsc}
        FROM ${cls.getTableNameEsc()}
        ${laterals.filter(Boolean).join('\n')};`
  ddlStatementsCollector.push(statement)
  if (cls.xapiClass.description) {
    commentStatementsCollector.push(commentDDL('VIEW', viewNameEsc, cls.xapiClass.description))
  }
}

export class GroupRefDbSaver {
  constructor(tableNameEsc, fieldName, aggregation) {
    const fieldRelationEsc = escapeIdentifier(fieldName + '_t')
    const colNameEsc = escapeIdentifier(fieldName)
    this.viewExpressionEsc = `${fieldRelationEsc}.${colNameEsc}`
    // we need LEFT JOIN ... ON TRUE so that the join doesn't skip empty rows.
    this.viewLateral = `
        LEFT JOIN LATERAL (
          SELECT ${aggregation} AS ${colNameEsc}
          FROM ${tableNameEsc} AS linked
          WHERE linked.owner=uuid
      ) AS ${fieldRelationEsc} ON TRUE`
  }

  async saveRows(_dbClient, _rows, _allOwners) {
    throw new Error('abstract method')
  }
}

/**
 * Saver for a Set table.
 * Set-typed class fields referencing another class are materialized as a separate association table to reflect the foreign key constraint.
 *
 * The `owner` of a row of said table is the uuid of the entity whose field is materialized.
 * Emptying Sets needs a bit of gymnastics explained in `saveRows()`
 */
export class SetFieldDbSaver extends GroupRefDbSaver {
  constructor(tableNameEsc, fieldName) {
    // we need "coalesce" because empty groups produce null instead of {}
    const aggregation = `COALESCE(array_agg(linked.member ORDER BY linked.member), '{}')`
    super(tableNameEsc, fieldName, aggregation)
    // UNNEST https://stackoverflow.com/a/31071043
    // UNNEST allows binding arrays of columns; instead of binding dozens of individual parameters.
    // it's necessary because postgres only allows single type arrays so we can't send an array of rows
    this.mergeStatement = `
        MERGE INTO ${tableNameEsc} t
        USING UNNEST($1::${UUID_TYPE}[], $2::${UUID_TYPE}[])
            AS src(owner, member)
        ON (t.owner = src.owner AND
            t.member = src.member)
        WHEN MATCHED THEN
            DO NOTHING
        WHEN NOT MATCHED THEN
            INSERT (owner, member) VALUES (src.owner, src.member)
        WHEN NOT MATCHED BY SOURCE AND t.owner = ANY ($3::${UUID_TYPE}[]) THEN
            DELETE;`
  }

  /**
   * Save a bunch of rows for this field to DB.
   * @param dbClient
   * @param {Object<string, string>[]} records the [owner.uuid -> referenced.uuid] tuples making the Set content.
   * Caller ensures no duplicate rows, SQL with error otherwise.
   * @param {string[]} allOwners the uuids of all the owner entities of this field, uuids appearing here but not in any
   * `records` will have all their corresponding DB records wiped out.
   * It is a way to empty the set since having no record could either mean 'got emptied' or 'was not changed'.
   * @returns {Promise<void>}
   */
  async saveRows(dbClient, records, allOwners) {
    const { owner: owners, member: values } = rows2Columns(records, ['owner', 'member'])
    await dbClient.query(this.mergeStatement, [owners, values, allOwners])
  }
}

/**
 * Saver for a Map table.
 * Map-typed class fields referencing another class (either in their key or their value, or both) are materialized as
 * a separate association table to reflect the foreign key constraint.
 *
 * The "owner" of a row of said table is the uuid of the entity whose field is materialized.
 *
 * E.g.: `pool.blobs` typed `(string -> blob ref) map` will produce a table `pool_blobs(oner, key, value)`.
 *
 * Emptying Maps needs a bit of gymnastics explained in `saveRows()`.
 */
export class MapFieldDbSaver extends GroupRefDbSaver {
  keySQLType
  valueSQLType

  constructor(tableNameEsc, fieldName, keySQLType, valueSQLType) {
    const aggregation = `COALESCE(json_object_agg(linked."key", linked."value" ORDER BY linked."key"), '{}')`
    super(tableNameEsc, fieldName, aggregation)
    this.keySQLType = keySQLType
    this.valueSQLType = valueSQLType
    // UNNEST https://stackoverflow.com/a/31071043
    // UNNEST allows binding arrays of columns; instead of binding dozens of individual parameters.
    // it's necessary because postgres only allows single type arrays so we can't send an array of rows
    this.mergeStatement = `
        MERGE INTO ${tableNameEsc} t
        USING UNNEST($1::${UUID_TYPE}[], $2::${keySQLType}[], $3::${valueSQLType}[])
            AS src(owner, key, value)
        ON (t.owner = src.owner AND t.key = src.key)
        WHEN MATCHED THEN
            UPDATE SET value = src.value
        WHEN NOT MATCHED THEN
            INSERT (owner, key, value) VALUES (src.owner, src.key, src.value)
        WHEN NOT MATCHED BY SOURCE AND t.owner = ANY($4::${UUID_TYPE}[]) THEN
            DELETE;`
  }

  /**
   *
   * @param dbClient
   * @param records caller ensures no [owner, key] duplicates, SQL with error otherwise.
   * @param {string[]} allOwners the uuids of all the owners of this field, uuids appearing here but not in records will
   * have all the records for this field wiped out.
   * It is a way to empty the map since having no record could either mean 'got emptied' or 'was not changed', if the
   * uuid is in allOwners, it means 'got emptied'.
   * @returns {Promise<void>}
   */
  async saveRows(dbClient, records, allOwners) {
    const { owner: owners, key: keys, value: values } = rows2Columns(records, ['owner', 'key', 'value'])
    await dbClient.query(this.mergeStatement, [owners, keys, values, allOwners])
  }
}

/** find or create the schemas to store the data of the given pool uuid.
 * The uuid is shortened and used in the name. The full uuid is stored as a comment and used to avoid collisions.
 * @param dbClient
 * @param poolUuid
 * @param {Object} prefixes
 * @return {Promise<{}>}
 */
export async function ensureSchemasExistsWithoutConflict(dbClient, poolUuid, prefixes) {
  // https://stackoverflow.com/a/52171480
  const generateHash = string => {
    let hash = 9
    for (const char of string) {
      hash = Math.imul(hash ^ char.charCodeAt(0), 9 ** 9)
    }
    return Math.abs(hash ^ (hash >>> 9)).toString(16)
  }
  const shortId = generateHash(poolUuid)
  let result = {}
  dbClient.query(`BEGIN TRANSACTION;`)
  try {
    const schemas = (
      await dbClient.query(`SELECT oid, nspname, obj_description(oid) AS comment FROM pg_namespace order by nspname;`)
    ).rows
    const checkSchemaNamesAreAvailable = id =>
      Object.values(prefixes).every(p => schemas.find(s => s.nspname === p + '_' + id) == null)
    const schemasByComment = Object.groupBy(schemas, s => s.comment)
    if (schemasByComment[poolUuid]) {
      for (const [type, prefix] of Object.entries(prefixes)) {
        const found = schemasByComment[poolUuid].find(s => s.nspname.startsWith(prefix))
        if (found) {
          result[type] = found.nspname
        }
      }
      if (Object.keys(result).length === Object.keys(prefixes).length) {
        await dbClient.query(`ROLLBACK TRANSACTION;`)
        return result
      }
    }
    if (checkSchemaNamesAreAvailable(shortId)) {
      result = Object.fromEntries(Object.entries(prefixes).map(([type, p]) => [type, p + '_' + shortId]))
    } else {
      for (let i = 2; i < 100; i++) {
        const currentId = shortId + '_' + i
        if (checkSchemaNamesAreAvailable(currentId)) {
          result = Object.fromEntries(Object.entries(prefixes).map(([type, p]) => [type, p + '_' + currentId]))
          break
        }
      }
    }
    if (Object.keys(result).length === 0) {
      throw new Error('Could not find a unique schema name for the pool ' + poolUuid)
    }
    for (const schemaName of Object.values(result)) {
      await dbClient.query(`CREATE SCHEMA IF NOT EXISTS ${escapeIdentifier(schemaName)}`)
      await dbClient.query(`COMMENT ON SCHEMA ${escapeIdentifier(schemaName)} IS ${escapeLiteral(poolUuid)};`)
    }
    await dbClient.query(`COMMIT TRANSACTION;`)
    return result
  } catch (e) {
    await dbClient.query(`ROLLBACK TRANSACTION;`)
    throw e
  }
}

/**
 * checks out a client if first param is a pool, otherwise just run the task with the first param
 * @param {Pool|Client} poolOrClient
 * @param task
 * @return {Promise<*>}
 */
export async function withClient(poolOrClient, task) {
  if (poolOrClient instanceof Pool) {
    const client = await poolOrClient.connect()
    try {
      return await task(client)
    } finally {
      client.release()
    }
  } else {
    assert.ok(
      poolOrClient instanceof Client,
      `poolOrClient was expected to be an instance of pg.Client, was: ${poolOrClient ? Object.getPrototypeOf(poolOrClient) : poolOrClient}`
    )
    return await task(poolOrClient)
  }
}
