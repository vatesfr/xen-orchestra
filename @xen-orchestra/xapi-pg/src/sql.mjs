import { escapeIdentifier, escapeLiteral } from 'pg'
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
      if (defaultValue != null) sql += ` DEFAULT ${escapeLiteral(String(defaultValue))}`
      this.createTableColumns.push(sql)
      this.availableAtCreateColumns.add(colName)
    }
    if (comment) {
      this.delayedDDL.push(`COMMENT ON COLUMN ${tableNameEsc}.${colEsc} IS ${escapeLiteral(comment)};`)
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
    const atCreationPrimaryKey = this.primaryKeyCols?.every(col => this.availableAtCreateColumns.has(col))
    const delayedPrimaryKey = this.primaryKeyCols && !atCreationPrimaryKey
    const columDefs = this.createTableColumns
    if (atCreationPrimaryKey) columDefs.push(primaryKeyClause)
    const tableEsc = absRelationEsc(this.schema, this.name)
    const create = `CREATE TABLE IF NOT EXISTS ${tableEsc} (${columDefs.join(', ')})`
    if (this.comment) this.delayedDDL.push(`COMMENT ON TABLE ${tableEsc} IS ${escapeLiteral(this.comment)};`)
    if (this.indices)
      for (const { name, columns } of this.indices) {
        this.delayedDDL.push(
          `CREATE INDEX IF NOT EXISTS ${escapeIdentifier(name)} ON ${tableEsc} (${columns.map(c => escapeIdentifier(c)).join(', ')});`
        )
      }
    // using delayed alter table because the targeted column might be added by a belated "alter table"
    if (delayedPrimaryKey)
      this.delayedDDL.push(`ALTER TABLE ${tableEsc}
        ADD ${primaryKeyClause}`)
    return { immediate: [create], delayed: this.delayedDDL }
  }
}

export const absRelationEsc = (schema, tableName) => `${escapeIdentifier(schema)}.${escapeIdentifier(tableName)}`
export const absReferenceEsc = (schema, tableName, colName) =>
  `${absRelationEsc(schema, tableName)}(${escapeIdentifier(colName)})`

export function createViewDDL(cls, viewNameEsc, ddlStatementsCollector, commentStatementsCollector) {
  const columnsEsc = []
  const laterals = []
  for (const f of cls.fields) {
    const colNameEsc = escapeIdentifier(f.name)
    columnsEsc.push(f.viewExpressionEsc)
    laterals.push(f.viewLateral)
    commentStatementsCollector.push(`COMMENT ON COLUMN ${viewNameEsc}.${colNameEsc} IS ${escapeLiteral(f.comment)}`)
  }
  const projectionEsc = columnsEsc.join(', ')
  const statement = `
    CREATE OR REPLACE VIEW ${viewNameEsc} AS SELECT ${projectionEsc}
        FROM ${cls.getTableNameEsc()}
        ${laterals.filter(Boolean).join('\n')};`
  ddlStatementsCollector.push(statement)
  if (cls.xapiClass.description) {
    commentStatementsCollector.push(`COMMENT ON VIEW ${viewNameEsc} IS ${escapeLiteral(cls.xapiClass.description)}`)
  }
}

export class GroupRefDbSaver {
  constructor(tableNameEsc, fieldName, ownerFieldName, aggregation) {
    const ownerEsc = escapeIdentifier(ownerFieldName)
    const fieldRelationEsc = escapeIdentifier(fieldName + '_t')
    const colNameEsc = escapeIdentifier(fieldName)
    this.viewExpressionEsc = `${fieldRelationEsc}.${colNameEsc}`
    // we need "coalesce" because empty groups produce null instead of {}
    this.viewLateral = `
        LEFT JOIN LATERAL (
          SELECT ${aggregation} AS ${colNameEsc}
          FROM ${tableNameEsc} linked
          WHERE linked.${ownerEsc}=uuid
      ) ${fieldRelationEsc} ON TRUE`
  }

  async saveRows(_dbClient, _rows, _allOwners) {
    throw new Error('abstract method')
  }
}

/**
 * Saver for a Set table.
 * Set-typed class fields referencing another class are materialized as a separate association table to reflect the foreign key cnstraint.
 *
 * The `owner` of a row of said table is the uuid of the entity whose field is materialized.
 * Emptying Sets needs a bit of gymnastics explained in `saveRows()`
 */
export class SetFieldDbSaver extends GroupRefDbSaver {
  ownerFieldName
  referenceFieldName

  constructor(tableNameEsc, fieldName, ownerFieldName, referenceFieldName) {
    const colNameEsc = escapeIdentifier(fieldName)
    const aggregation = `COALESCE(array_agg(linked.${colNameEsc} ORDER BY linked.${colNameEsc}), '{}')`
    super(tableNameEsc, fieldName, ownerFieldName, aggregation)
    this.ownerFieldName = ownerFieldName
    this.referenceFieldName = referenceFieldName
    const ownerEsc = escapeIdentifier(ownerFieldName)
    const refEsc = escapeIdentifier(referenceFieldName)
    // UNNEST https://stackoverflow.com/a/31071043
    // UNNEST allows binding arrays of columns, instead of binding dozens of individual parameters
    // it's necessary because postgres only allows single type arrays so we can't send an array of rows
    this.mergeStatement = `
        MERGE INTO ${tableNameEsc} t
        USING UNNEST($1::${UUID_TYPE}[], $2::${UUID_TYPE}[])
            AS src(${ownerEsc}, ${refEsc})
        ON (t.${ownerEsc} = src.${ownerEsc} AND
            t.${refEsc} = src.${refEsc})
        WHEN MATCHED THEN
            DO NOTHING
        WHEN NOT MATCHED THEN
            INSERT (${ownerEsc}, ${refEsc}) VALUES (src.${ownerEsc}, src.${refEsc})
        WHEN NOT MATCHED BY SOURCE AND t.${ownerEsc} = ANY ($3::${UUID_TYPE}[]) THEN
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
    const { [this.ownerFieldName]: owners, [this.referenceFieldName]: values } = rows2Columns(records, [
      this.ownerFieldName,
      this.referenceFieldName,
    ])
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
 * E.g.: `pool.blobs` typed `(string -> blob ref) map` will produce a table `pool_blobs(pool, key, value)`.
 * `pool` will be the "owner" field, that is the foreign key to `pool.uuid`.
 *
 * Emptying Maps needs a bit of gymnastics explained in `saveRows()`.
 */
export class MapFieldDbSaver extends GroupRefDbSaver {
  ownerFieldName
  keySQLType
  valueSQLType

  constructor(tableNameEsc, fieldName, ownerFieldName, keySQLType, valueSQLType) {
    const aggregation = `COALESCE(json_object_agg(linked."key", linked."value" ORDER BY linked."key"), '{}')`
    super(tableNameEsc, fieldName, ownerFieldName, aggregation)
    this.keySQLType = keySQLType
    this.valueSQLType = valueSQLType
    this.ownerFieldName = ownerFieldName
    const ownerEsc = escapeIdentifier(ownerFieldName)
    // UNNEST https://stackoverflow.com/a/31071043
    // UNNEST allows binding arrays of columns, instead of binding dozens of individual parameters
    // it's necessary because postgres only allows single type arrays so we can't send an array of rows
    this.mergeStatement = `
        MERGE INTO ${tableNameEsc} t
        USING UNNEST($1::${UUID_TYPE}[], $2::${keySQLType}[], $3::${valueSQLType}[])
            AS src(${ownerEsc}, key, value)
        ON (t.${ownerEsc} = src.${ownerEsc} AND t.key = src.key)
        WHEN MATCHED THEN
            UPDATE SET value = src.value
        WHEN NOT MATCHED THEN
            INSERT (${ownerEsc}, key, value) VALUES (src.${ownerEsc}, src.key, src.value)
        WHEN NOT MATCHED BY SOURCE AND t.${ownerEsc} =ANY($4::${UUID_TYPE}[]) THEN
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
    const {
      [this.ownerFieldName]: owners,
      key: keys,
      value: values,
    } = rows2Columns(records, [this.ownerFieldName, 'key', 'value'])
    await dbClient.query(this.mergeStatement, [owners, keys, values, allOwners])
  }
}
