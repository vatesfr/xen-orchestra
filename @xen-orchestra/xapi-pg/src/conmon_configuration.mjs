import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { convertClassesToTables, createViewNames, createViewsDDL } from './db.mjs'
import { createEventModels } from './db_history.mjs'
import { LifeCycleStates, loadXapiClasses } from './xapi.mjs'

// Common code for both the reader and the writer process

const TABLE_SCHEMA_PREFIX = 'test_xapi'
const VIEW_SCHEMA_PREFIX = 'test_xapi_view'
const EVENT_SCHEMA_PREFIX = 'test_xapi_events'

// class 'user' doesn't allow `.get_all_records()`
const SKIP_XAPI_CLASSES = new Set(['event', 'user'])
// removing the classes not having an uuid field
const XAPI_CLASS_FILTER = cls => !SKIP_XAPI_CLASSES.has(cls.name) && 'uuid' in cls.fields
const lifecycleStates = new Set([LifeCycleStates.Published])

export function getSchemaPrefixes() {
  return {
    tableSchema: TABLE_SCHEMA_PREFIX,
    viewSchema: VIEW_SCHEMA_PREFIX,
    eventSchema: EVENT_SCHEMA_PREFIX,
  }
}

/**
 * load the xapi json file and return the filtered classes dict
 * @return {Promise<Record<string, {name: string, description: string, fields: Object<string, TransformedField>, enums: []}>>}
 */
export async function loadXapiDefinition() {
  const data = JSON.parse(await readFile(join(import.meta.dirname, '../xenapi.json'), 'utf8'))
  return loadXapiClasses(lifecycleStates, XAPI_CLASS_FILTER, data)
}

/**
 * @import {XapiDBClass} from "./db.mjs"
 *  Reads the XAPI JSON file and create the set of representation objects.
 *  From the returned parameters, the caller can either run the DDL against the DB or read/write to an existing DB.
 * @returns {Promise<{CLASSES_DICT: Object<string, TransformedClass>, XAPIDBCLASSES: Object<string, XapiDBClass>}>}
 */
export async function getDbObjectsForSchemas(schemas, classesDict = undefined) {
  const { tableSchema, eventSchema, viewSchema } = schemas
  let CLASSES_DICT = classesDict
  if (CLASSES_DICT === undefined) {
    CLASSES_DICT = loadXapiDefinition()
  }
  const XAPIDBCLASSES = convertClassesToTables(CLASSES_DICT, tableSchema)
  const EVENT_MODELS = createEventModels(eventSchema)
  const VIEW_NAMES = createViewNames(viewSchema, Object.values(XAPIDBCLASSES))
  function getAllTheDDL() {
    const mainDDL = []
    const indirectDDL = []
    for (const cls of Object.values(XAPIDBCLASSES)) {
      const { mainTableDDL, throughTablesDDL } = cls.getSplitDDL()
      mainDDL.push(...mainTableDDL)
      indirectDDL.push(...throughTablesDDL)
    }
    return [
      ...mainDDL,
      ...indirectDDL,
      ...createViewsDDL(viewSchema, XAPIDBCLASSES, VIEW_NAMES).statements,
      ...EVENT_MODELS.getDDL(),
    ]
  }
  return { CLASSES_DICT, XAPIDBCLASSES, EVENT_MODELS, VIEW_NAMES, tableSchema, eventSchema, viewSchema, getAllTheDDL }
}
