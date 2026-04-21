import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { convertClassesToTables, createViewNames } from './db.mjs'
import { createEventModels } from './db_history.mjs'
import { LifeCycleStates, loadXapiClasses } from './xapi.mjs'

// Common code for both the reader and the writer process

export const DB_URL = 'postgresql://localhost:5432/postgres'
const TABLE_SCHEMA_PREFIX = 'test_xapi'
const VIEW_SCHEMA_PREFIX = 'test_xapi_view'
const EVENT_SCHEMA_PREFIX = 'test_xapi_events'

// class 'user' doesn't allow `.get_all_records()`
const SKIP_XAPI_CLASSES = new Set(['event', 'user'])
// removing the classes not having an uuid field
const XAPI_CLASS_FILTER = cls => !SKIP_XAPI_CLASSES.has(cls.name) && 'uuid' in cls.fields
const lifecycleStates = new Set([LifeCycleStates.Published])

export function getSchemaNames(schemaId) {
  return {
    tableSchema: TABLE_SCHEMA_PREFIX + `_${schemaId}`,
    viewSchema: VIEW_SCHEMA_PREFIX + `_${schemaId}`,
    eventSchema: EVENT_SCHEMA_PREFIX + `_${schemaId}`,
  }
}

/**
 * @import {XapiDBClass} from "./db.mjs"
 *  Reads the XAPI JSON file and create the set of representation objects.
 *  From the returned parameters, caller can either run the DDL against the DB or read/write to an existing DB.
 * @returns {Promise<{CLASSES_DICT: Object<string, TransformedClass>, XAPIDBCLASSES: Object<string, XapiDBClass>}>}
 */
export async function getDbObjects(schemaId) {
  const { tableSchema, eventSchema, viewSchema } = getSchemaNames(schemaId)
  const data = JSON.parse(await readFile(join(import.meta.dirname, '/../xenapi.json'), 'utf8'))
  const CLASSES_DICT = loadXapiClasses(lifecycleStates, XAPI_CLASS_FILTER, data)
  const XAPIDBCLASSES = convertClassesToTables(CLASSES_DICT, tableSchema)
  const EVENT_MODELS = await createEventModels(eventSchema)
  const VIEW_NAMES = createViewNames(viewSchema, Object.values(XAPIDBCLASSES))
  return { CLASSES_DICT, XAPIDBCLASSES, EVENT_MODELS, VIEW_NAMES, tableSchema, eventSchema, viewSchema }
}
