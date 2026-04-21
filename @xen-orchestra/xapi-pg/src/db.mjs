import assert from 'node:assert'
import { escapeIdentifier } from 'pg'
import { absRelationEsc, createInsert, createViewDDL, MapFieldDbSaver, SetFieldDbSaver, TableCreator } from './sql.mjs'
import {
  converterForSimpleType,
  convertSimpleType,
  isNonRef,
  isSimpleType,
  isStorableRef,
  isSupportedMapType,
  isSupportedSetType,
  JSON_TYPE,
  splitMapType,
  unwrapDirectRef,
  unwrapOption,
  unwrapSet,
  UUID_TYPE,
} from './types.mjs'

/**
 * @file This is main Db storage code.
 *  - It only targets postgres.
 *  - The strategy is to store the data for each pool in its own schema.
 *  - The 'Esc' suffix in the variable names denotes sanitized identifiers.
 *
 * Raw PG is replacing Sequelize because a bug prevents using multiple tables with the same name in different schema,
 and the Fix has stalled in GitHub (https://github.com/sequelize/sequelize/pull/17511).
 */
/**
 *
 */
export class XapiDBClass {
  xapiClass
  /** @type {string} */
  name
  /** @type {string} the postgres schema for the corresponding table */
  schema
  /** the DB view for this entity */
  viewNameEsc = null
  /** @type {XapiDbField[]} */
  fields = []

  /** @type {XapiDbField[]} */
  nonRefFields = []

  /** @type {XapiDbField[]} */
  refFields = []

  constructor(xapiClass, schema) {
    this.name = xapiClass.name
    this.xapiClass = xapiClass
    this.schema = schema
  }

  getField(name) {
    return this.nonRefFields.concat(this.refFields).find(f => f.name === name)
  }

  /**
   * the list of non-ref columns names that can be updated in the table
   * @returns {string[]}
   */
  getUpdateOnDuplicateNonRef() {
    return this.nonRefFields.filter(f => f.name !== 'uuid').map(f => f.name)
  }

  /**
   * the list of foreign key columns names that can be updated in the table
   * @returns {string[]}
   */
  getUpdateOnDuplicateRef() {
    return this.refFields.filter(f => !f.isSeparateTable).map(f => f.name)
  }

  /** the first step, prepare metadata for a table containing only the non-reference fields; it should at least have an uuid attribute */
  convertNonRefFieldsToDbModel() {
    const nonRefFields = Object.values(this.xapiClass.fields).filter(f => isNonRef(f.type))
    const dbFields = nonRefFields
      .map(f => xapi2DbField(this.name, f.name, f.type, f.description, f.default))
      .filter(Boolean)
    this.fields.push(...dbFields)
    this.nonRefFields.push(...dbFields)
  }

  /** the second step, update the class metadata to add the reference columns */
  convertRefFieldsToDBModel(modelDict) {
    const refFields = Object.values(this.xapiClass.fields).filter(f => isStorableRef(f.type))
    const convertField = f => xapi2DbRefField(this, f.name, f.type, f.description + ` [${f.type}]`, modelDict)
    const convertField2 = f => {
      const res = convertField(f)
      if (res == null) {
        throw new Error(`Unknown ref field: ${f.name} in ${this.name}, type ${f.type}`)
      }
      return res
    }
    const dbFields = refFields.map(convertField2)
    this.fields.push(...dbFields)
    this.refFields.push(...dbFields)
  }

  getTableNameEsc() {
    return absRelationEsc(this.schema, this.name)
  }

  getDDL() {
    const { mainTableDDL, throughTablesDDL } = this.getSplitDDL()
    return [...mainTableDDL, ...throughTablesDDL]
  }

  /**
   * Returns DDL split into main table statements and reference table statements.
   * This allows callers to create all main tables first, then all through-tables,
   * avoiding foreign key ordering issues.
   * @returns {{mainTableDDL: string[], throughTablesDDL: string[]}}
   */
  getSplitDDL() {
    const delayedDDL = []
    const creator = new TableCreator(this.schema, this.name, this.xapiClass.description)
    for (const f of this.fields) {
      if (!f.isSeparateTable) {
        let reference = null
        if (f.sequelizeDef.references) {
          reference = {
            schema: this.schema,
            table: f.sequelizeDef.references.model,
            column: f.sequelizeDef.references.key,
            onUpdate: f.sequelizeDef.onUpdate,
            onDelete: f.sequelizeDef.onDelete,
          }
        }
        creator.addColumn(f.name, f.sequelizeDef.type, f.sequelizeDef.defaultValue, reference, f.comment)
        if (f.sequelizeDef.primaryKey) creator.addPrimaryKey(f.name)
      }
    }
    const { immediate, delayed } = creator.getDDL()
    delayedDDL.push(...delayed)
    for (const f of this.fields) {
      if (f.isSeparateTable) {
        delayedDDL.push(...f.getDDL(this.schema))
      }
    }
    return { mainTableDDL: immediate, throughTablesDDL: delayedDDL }
  }

  /**
   * Preparing records for the DB, using a 3-step method.
   * The first step is converting all the non-refs to the DB format
   * @param records
   * @return {{actualColumns:Set<string>, newRecords:record[]}}
   */
  nonRefXapi2Db(records) {
    const actualColumns = new Set()
    const newRecords = records.map(record => {
      const result = {}
      for (const field of this.nonRefFields) {
        // preserve missing fields for default value handling
        if (field.name in record) {
          actualColumns.add(field.name)
          result[field.name] = field.xapi2Db(record[field.name])
        }
      }
      return result
    })
    return { newRecords, actualColumns }
  }

  /**
   * Second, get all the references to be translated to UUID.
   * (this method works to extract uuids from db rows too)
   * @param records
   * @returns {Set<string>}
   */
  getRefsFromRecords(records) {
    const refs = new Set()
    for (const record of records) {
      for (const field of this.refFields) {
        field.getRefsFromRecord(record).forEach(ref => refs.add(ref))
      }
    }
    return refs
  }

  /**
   * Third, create the reference record to be upserted.
   * Reference fields might be materialized to a separate table, so the records get split in groups per table.
   *  @param  records
   *  @param {function(string): string} refConverter
   *  @return {{separate: Object.<string, {records: Object[], allOwners: string[]}>, inside: *[]}}
   *    the serializable records, `inside` for the main table fields, `separate` for separate table fields.
   *    * `sepatate.field.records` are the actual separate table rows,
   *    * `sepatate.field.allOwners` is the list of all the main table primary keys, Ids in this list not having a record in `sepatate.field.records` have an empty field value.
   */

  refXapi2Db(records, refConverter) {
    const separateTableRecords = {}
    const sameTableFields = []
    const separateTableFields = []
    const sameTableRecords = []
    const allOwners = []
    for (const field of this.refFields) {
      if (field.isSeparateTable) {
        separateTableRecords[field.name] = { records: [], allOwners }
        separateTableFields.push(field)
      } else {
        sameTableFields.push(field)
      }
    }
    for (const record of records) {
      allOwners.push(record.uuid)
      if (sameTableFields.length) {
        const sameRow = { uuid: record.uuid }
        for (const field of sameTableFields) {
          sameRow[field.name] = field.xapi2Db(record[field.name], refConverter)
        }
        sameTableRecords.push(sameRow)
      }
      for (const field of separateTableFields) {
        const rows = field.xapi2Db(record[field.name], refConverter, record.uuid)
        separateTableRecords[field.name].records.push(...rows)
      }
    }
    return { separate: separateTableRecords, inside: sameTableRecords }
  }

  /**
   * Does the firsts 2 steps in one action: call persists the 'non ref' records, and return all the references in the ref records.
   * @returns {Promise<Set<string>>}
   * @param dbClient
   * @param records
   */
  async persistNonRefRecordsToDB(dbClient, records) {
    const { newRecords: nonRefRecords, actualColumns } = this.nonRefXapi2Db(records)
    if (actualColumns.size) {
      const updatableFields = this.getUpdateOnDuplicateNonRef().filter(fName => actualColumns.has(fName))
      const { sql, bind } = createInsert(this, updatableFields, Array.from(actualColumns), nonRefRecords)
      await dbClient.query(sql, bind)
    }
    return this.getRefsFromRecords(records)
  }

  /**
   *
   * @returns {Promise<void>}
   * @param dbClient
   * @param records
   * @param {(ref:string)=>string} refConverter
   */
  async persistRefRecordsToDB(dbClient, records, refConverter) {
    const { inside: insideRecords, separate: separateRecords } = this.refXapi2Db(records, refConverter)
    if (insideRecords.length) {
      const columns = Object.keys(insideRecords[0])
      const updatableFields = this.getUpdateOnDuplicateRef().filter(fName => columns.includes(fName))
      const { sql, bind } = createInsert(this, updatableFields, columns, insideRecords)
      await dbClient.query(sql, bind)
    }
    for (const [fieldName, { records, allOwners }] of Object.entries(separateRecords)) {
      await this.getField(fieldName).customSaver.saveRows(dbClient, records, allOwners)
    }
  }

  /**
   * Transform a batch of records in place.
   * I didn't make a perfect separation of concerns, and this function mostly assumes the records come from the views
   * instead of from the tables.
   */
  db2XapiRecords(records, refConverter) {
    for (const record of records) {
      for (const f of this.fields) {
        record[f.name] = f.db2Xapi(record[f.name], refConverter)
      }
    }
    return records
  }
}

export class XapiDbField {
  name
  type
  /** can be indirect ref */
  isRef
  sequelizeDef
  /** @type {GroupRefDbSaver} */
  customSaver
  /** field is materialized in a separate table (map or set) */
  isSeparateTable = false
  throughTableName = null
  comment = null
  viewExpressionEsc = null

  constructor(name, type, sequelizeDef, comment = '', customSaver = null, throughTableName = null) {
    this.name = name
    this.type = type
    this.throughTableName = throughTableName
    this.comment = comment
    /** the view projection part */
    this.viewExpressionEsc = customSaver ? customSaver.viewExpressionEsc : escapeIdentifier(name)
    /** some fields need a correlated query in the view FROM */
    this.viewLateral = customSaver ? customSaver.viewLateral : ''
    this.isRef = !isNonRef(type)
    this.sequelizeDef = sequelizeDef
    this.isSeparateTable = !!customSaver
    this.customSaver = customSaver
  }

  getDDL(schema) {
    if (!this.isSeparateTable) return []
    const creator = new TableCreator(schema, this.throughTableName, this.comment)
    for (const [colName, colDef] of Object.entries(this.throughTableAttributes)) {
      let reference = null
      if (colDef.references)
        reference = {
          schema,
          table: colDef.references.model,
          column: colDef.references.key,
          onUpdate: colDef.onUpdate,
          onDelete: colDef.onDelete,
        }
      creator.addColumn(colName, colDef.type, colDef.defaultValue, reference, null)
      if (colDef.primaryKey) creator.addPrimaryKey(colName)
    }
    if (this.throughTableIndexes) {
      for (const index of this.throughTableIndexes) {
        creator.addIndex(`${this.throughTableName}_${index.fields.join('_')}`, index.fields)
      }
    }
    const code = creator.getDDL()
    return code.immediate.concat(code.delayed)
  }

  xapi2Db(jsonValue, _refConverter, _ownerUuid) {
    return jsonValue
  }

  db2Xapi(dbValue, _refConverter) {
    return dbValue
  }

  /**
   *
   * @param _record
   * @returns {string[]}
   */
  getRefsFromRecord(_record) {
    return []
  }
}

/**
 * Transform an array of records into a dict of columns
 * `[{f1:v1, f2: 10}, {f1:v2, f2: 11}]` -> `{f1:[v1, v2], f2:[10, 11]}`
 *
 * If the records have a different set of record keys, the missing values will be taken from `defaultValuesRecord`.
 *
 * `[{f1:v1}, {f2: 11}]` -> `{f1:[v1, defF2], f2:[defF1, 11]}`
 * @param {Object[]} records
 * @param {Iterable<string>} columnList the columns to extract, can be used for projection
 * @param {Object} defaultValuesRecord
 * @returns {Object<string, []>}
 */
export function rows2Columns(records, columnList = null, defaultValuesRecord = {}) {
  if (columnList == null) {
    const actualColumns = new Set()
    for (const record of records) {
      for (const key of Object.keys(record)) {
        actualColumns.add(key)
      }
    }
    columnList = Array.from(actualColumns)
  }
  const res = {}
  for (const c of columnList) {
    res[c] = records.map(r => (c in r ? r[c] : defaultValuesRecord[c]))
  }
  return res
}

/**
 * converts a non ref Xapi field to a DB column
 * @param className
 * @param fieldName
 * @param xapiType
 * @param fieldDescription
 * @param {any} defaultValue
 * @returns {XapiDbField | Undefined}
 */
export function xapi2DbField(className, fieldName, xapiType, fieldDescription, defaultValue = null) {
  assert.ok(isNonRef(xapiType))
  const attributeOptions = { name: fieldName }
  const comment = `${fieldDescription} (type: ${xapiType})`
  if (fieldName === 'id' || fieldName === 'uuid') {
    attributeOptions.primaryKey = true
  }
  if (fieldName === 'uuid') {
    assert.equal(unwrapOption(xapiType), 'string')
    return new XapiDbField(fieldName, xapiType, { type: UUID_TYPE, ...attributeOptions }, comment)
  }
  if (isSimpleType(xapiType)) {
    if (defaultValue) attributeOptions.defaultValue = converterForSimpleType(xapiType)[0](defaultValue)
    const dbField = new XapiDbField(
      fieldName,
      xapiType,
      { type: convertSimpleType(xapiType), ...attributeOptions },
      comment
    )
    ;[dbField.xapi2Db, dbField.db2Xapi] = converterForSimpleType(xapiType)
    return dbField
  }
  const setContent = unwrapSet(xapiType)
  if (setContent) {
    if (isNonRef(setContent)) {
      // avoiding array types that might clash with unnest()
      const dbField = new XapiDbField(fieldName, xapiType, { type: JSON_TYPE, ...attributeOptions }, comment)
      dbField.xapi2Db = arrayValue => JSON.stringify(arrayValue)
      dbField.db2Xapi = stringValue => stringValue
      return dbField
    }
  }
  if (splitMapType(xapiType)) {
    // we know there are no references in the type
    return new XapiDbField(fieldName, xapiType, { type: JSON_TYPE, ...attributeOptions }, comment)
  }
  console.error(
    `Xapi type '${xapiType}' is not supported by the database conversion system, ignoring field '${className}.${fieldName}'.`
  )
}

function createRefSetDBField(xapiDbClass, fieldName, fieldDescription, xapiType) {
  const ref = unwrapDirectRef(unwrapSet(xapiType))
  const fromName = xapiDbClass.name
  const linkingTableName = fromName + '_' + fieldName
  const throughTableAttributes = {
    [fromName]: {
      type: UUID_TYPE,
      primaryKey: true,
      references: { model: fromName, key: 'uuid' },
      onDelete: 'CASCADE',
    },
    [fieldName]: {
      type: UUID_TYPE,
      primaryKey: true,
      references: { model: ref, key: 'uuid' },
      onDelete: 'CASCADE',
    },
  }
  const throughTableIndexes = [{ fields: [fromName] }]
  const linkTableEsc = absRelationEsc(xapiDbClass.schema, linkingTableName)
  const customSaver = new SetFieldDbSaver(linkTableEsc, fieldName, fromName, fieldName)
  const dbField = new XapiDbField(fieldName, xapiType, null, fieldDescription, customSaver, linkingTableName)
  dbField.throughTableAttributes = throughTableAttributes
  dbField.throughTableIndexes = throughTableIndexes
  dbField.xapi2Db = (value, refConverter, ownerUuid) => {
    if (value == null) return []
    if (value.length === 0) return []
    return value
      .map(refConverter)
      .filter(uuid => uuid != null)
      .map(uuid => ({
        [fromName]: ownerUuid,
        [fieldName]: uuid,
      }))
  }
  dbField.db2Xapi = (value, refConverter) => value.map(refConverter)
  dbField.getRefsFromRecord = record => (record[fieldName] == null ? [] : record[fieldName])
  return dbField
}

function createRefMapDBField(xapiDbClass, fieldName, fieldDescription, xapiType) {
  assert.ok(isSupportedMapType(xapiType))
  const [kType, vType] = splitMapType(xapiType)
  const fromClass = xapiDbClass.xapiClass
  const from = xapiDbClass
  const linkingTableName = fromClass.name + '_' + fieldName
  const transformField = type => {
    const refCls = unwrapDirectRef(type)
    if (refCls) {
      return { type: UUID_TYPE, references: { model: refCls, key: 'uuid' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' }
    }
    return { type: convertSimpleType(type) }
  }
  const throughTableAttributes = {
    [from.name]: {
      type: UUID_TYPE,
      primaryKey: true,
      references: { model: from.name, key: 'uuid' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    key: { ...transformField(kType), primaryKey: true },
    value: transformField(vType),
  }
  const throughTableIndexes = [{ fields: [from.name] }]

  let getRefsFromEntry
  let xapiEntry2Db
  if (unwrapDirectRef(kType) && unwrapDirectRef(vType)) {
    getRefsFromEntry = e => e
    xapiEntry2Db = (entry, refConverter) => entry.map(refConverter)
  } else if (unwrapDirectRef(kType)) {
    getRefsFromEntry = e => [e[0]]
    xapiEntry2Db = (entry, refConverter) => [refConverter(entry[0]), converterForSimpleType(vType)[0](entry[1])]
  } else {
    getRefsFromEntry = e => [e[1]]
    xapiEntry2Db = (entry, refConverter) => [converterForSimpleType(kType)[0](entry[0]), refConverter(entry[1])]
  }
  const linkingTableEsc = absRelationEsc(xapiDbClass.schema, linkingTableName)
  const customSaver = new MapFieldDbSaver(
    linkingTableEsc,
    fieldName,
    from.name,
    throughTableAttributes.key.type,
    throughTableAttributes.value.type
  )
  const dbField = new XapiDbField(fieldName, xapiType, null, fieldDescription, customSaver, linkingTableName)
  dbField.throughTableAttributes = throughTableAttributes
  dbField.throughTableIndexes = throughTableIndexes
  dbField.getRefsFromRecord = record => {
    const result = []
    for (const entry of Object.entries(record[fieldName] || {})) {
      result.push(...getRefsFromEntry(entry))
    }
    return result
  }
  dbField.xapi2Db = (value, refConverter, ownerUuid) => {
    if (value == null) return []
    const entries = Object.entries(value)
    if (entries.length === 0) return []
    return entries
      .map(e => {
        const [key, value] = xapiEntry2Db(e, refConverter)
        return { key, value, [from.name]: ownerUuid }
      })
      .filter(row => row.key && row[from.name])
  }
  dbField.db2Xapi = (value, refConverter) => {
    if (value == null) {
      return {}
    }
    let entries = Object.entries(value).map(e => xapiEntry2Db(e, refConverter))
    entries = entries.filter(e => e[0])
    return Object.fromEntries(entries)
  }
  return dbField
}

/**
 * converts a (maybe indirect) reference Xapi field to a DB column
 * @param xapiDbClass
 * @param {string} fieldName
 * @param {string} xapiType
 * @param {string} fieldDescription
 * @param modelDict
 * @returns {XapiDbField}
 */
export function xapi2DbRefField(xapiDbClass, fieldName, xapiType, fieldDescription, modelDict) {
  const ref = unwrapDirectRef(xapiType)
  if (ref) {
    const def = {
      type: UUID_TYPE,
      references: { model: modelDict[ref].name, key: 'uuid' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
    const dbField = new XapiDbField(fieldName, xapiType, def, fieldDescription)
    dbField.xapi2Db = (value, refConverter) => refConverter(value)
    dbField.db2Xapi = (value, refConverter) => refConverter(value)
    dbField.getRefsFromRecord = record => (record[fieldName] === null ? [] : [record[fieldName]])
    return dbField
  }
  if (isSupportedSetType(xapiType)) {
    return createRefSetDBField(xapiDbClass, fieldName, fieldDescription, xapiType)
  }
  if (isSupportedMapType(xapiType)) {
    return createRefMapDBField(xapiDbClass, fieldName, fieldDescription, xapiType)
  }
  throw new Error(`isStorableRef was true but no supported set or map type found for ${xapiType}`)
}

/**
 * The general function to store a bunch of objects to DB
 * @param dbClient
 * @param {{[className:string]: any[]}} recordsByClass
 * @param {{[className:string]: XapiDBClass}} xapiDbDict
 * @param {(references: Set<string>) => Promise<Map<string, string>>} bulkReferenceResolver
 */
export async function persistEntities(
  dbClient,
  recordsByClass,
  xapiDbDict,
  bulkReferenceResolver = async refs => new Map(refs.values().map(ref => [ref, ref]))
) {
  let referenceSet = new Set()
  for (const [className, records] of Object.entries(recordsByClass)) {
    const xapiDbModel = xapiDbDict[className]
    referenceSet = referenceSet.union(await xapiDbModel.persistNonRefRecordsToDB(dbClient, records))
  }
  /** @type {Map<string, string>} */
  const resolvedReferences = await bulkReferenceResolver(referenceSet)
  for (const [className, records] of Object.entries(recordsByClass)) {
    const xapiDbModel = xapiDbDict[className]
    await xapiDbModel.persistRefRecordsToDB(dbClient, records, ref => resolvedReferences.get(ref))
  }
}

/**
 * generate a DB model for each class.
 * @param {Object} classesDict
 * @param {string|null} schema optional DB schema name for table qualification
 * @return {Object<string, XapiDBClass>}
 */
export function convertClassesToTables(classesDict, schema) {
  /** @type {XapiDBClass[]} */
  const newClasses = []
  const xapiClasses = {}
  for (const clazz of Object.values(classesDict)) {
    const newClass = new XapiDBClass(clazz, schema)
    newClass.convertNonRefFieldsToDbModel()
    newClasses.push(newClass)
    xapiClasses[clazz.name] = newClass
  }
  for (const clazz of newClasses) {
    clazz.convertRefFieldsToDBModel(xapiClasses)
  }
  return xapiClasses
}

/**
 * create the names for a set of views mimicking the xapi entities
 * @param viewSchema
 * @param {XapiDBClass[]} classes a iterable of the xapi classes to be converted to view
 * @returns {Map<string, string>}} the resulting names
 */
export function createViewNames(viewSchema, classes) {
  const viewNames = new Map()
  for (const cls of classes) {
    const viewNameEsc = absRelationEsc(viewSchema, cls.name)
    cls.viewNameEsc = viewNameEsc
    viewNames.set(cls.name, viewNameEsc)
  }
  return viewNames
}

/**
 * create the DDL for a set of views mimicking the xapi entities, where all the ref sets are exposed as PG arrays.
 * @param viewSchema
 * @param {Object<string, XapiDBClass>} classes a iterable of the xapi classes to be converted to view
 * @param {Map<string, string> }viewNames
 * @returns {{statements: string[]}} an array of raw SQL DDL statements
 */
export function createViewsDDL(viewSchema, classes, viewNames) {
  const ddlStatements = [`CREATE SCHEMA IF NOT EXISTS ${escapeIdentifier(viewSchema)}`]
  const commentStatements = []
  for (const clsName of viewNames.keys()) {
    const cls = classes[clsName]
    createViewDDL(cls, cls.viewNameEsc, ddlStatements, commentStatements)
  }
  return { statements: ddlStatements.concat(commentStatements) }
}
