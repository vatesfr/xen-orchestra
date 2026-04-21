import { absRelationEsc } from './sql.mjs'
import { REF_TYPE, TOKEN_TYPE, UUID_TYPE, VARCHAR_255 } from './types.mjs'
import { NULL_REF } from './xapi.mjs'
/**
 *
 * @file This is the history tracker code.
 *
 * The goal is to reproduce XAPI's event.from() functionality out of the postgresSQL DB.
 * Some assumptions:
 *  - XAPI's event.from() return *all* and *only* the events that happened before the returned token.
 *  - we don't assume XAPI's event.from() will not return any event that happened before the parameter token.
 *  We know they have a pb, because sending an empty token sometimes returns 'del' operations.
 *  - we hope that Postgres collate attribute is ok for token comparison/sorting, because sequelize doesn't allow per
 *  column collation setting.
 *  - '' (empty string) is inferior to any other string in token comparison.
 *  - our user (the caller of eventsFrom()) is living in a subsampling timeline to our own. Users don't see
 *  tokens we have not seen prior to them. If they could see tokens faster or earlier than us, we would present them a
 *  view of the object graph that makes no sense to them.
 *  - calling eventsFrom() returns the newest complete state of the DB, we don't have to be able to restore an old version.
 */

/**
 *
 * @param eventTableNameEsc
 * @param historyTableNameEsc
 * @param ref2UuidTableName
 * @returns {string[]}
 */
export function getDDL(eventTableNameEsc, historyTableNameEsc, ref2UuidTableName) {
  const ddl = []
  ddl.push(`
    CREATE TABLE IF NOT EXISTS ${eventTableNameEsc}
    (
      token   ${TOKEN_TYPE} PRIMARY KEY,
      content JSONB
    );
  `)
  ddl.push(`
    CREATE TABLE IF NOT EXISTS ${historyTableNameEsc} (
      uuid ${UUID_TYPE} PRIMARY KEY,
      class ${VARCHAR_255} NOT NULL,
      created_before_token ${TOKEN_TYPE} NOT NULL REFERENCES ${eventTableNameEsc}(token) DEFERRABLE INITIALLY DEFERRED,
      operation_before_token ${TOKEN_TYPE} NOT NULL REFERENCES ${eventTableNameEsc}(token) DEFERRABLE INITIALLY DEFERRED,
      last_operation VARCHAR(10) DEFAULT 'add' NOT NULL
    );
  `)
  ddl.push(
    `CREATE INDEX IF NOT EXISTS "history_class_created_before_token_last_operation" ON ${historyTableNameEsc} (class, created_before_token, last_operation);`
  )
  ddl.push(`
    CREATE TABLE IF NOT EXISTS ${ref2UuidTableName} (
      uuid ${UUID_TYPE},
      ref ${REF_TYPE},
      lifetime_ref ${REF_TYPE},
      PRIMARY KEY (uuid, ref, lifetime_ref)
    );
  `)
  return ddl
}

export async function createEventModels(eventSchema) {
  const historyTableNameEsc = absRelationEsc(eventSchema, 'history')
  const eventTableNameEsc = absRelationEsc(eventSchema, 'event')
  const ref2UuidTableNameEsc = absRelationEsc(eventSchema, 'ref_uuid_assoc')
  return {
    getDDL: () => getDDL(eventTableNameEsc, historyTableNameEsc, ref2UuidTableNameEsc),
    eventTableName: eventTableNameEsc,
    historyTableName: historyTableNameEsc,
    ref2UuidTableName: ref2UuidTableNameEsc,
  }
}

/**
 * DB->XAPI
 * @param {Client} dbClient
 * @param {string} historyTableName
 * @param {string} className
 * @param {string} fromToken we want all the events happening after this token
 */
export async function eventsFrom(dbClient, historyTableName, className, fromToken) {
  // surviving models (last_operation != del)
  // whose birth could not have been witnessed at fromToken (created_before_token > fromToken)
  // are tagged 'add', whether new or mod.
  const resultAdd = await dbClient.query(
    `SELECT uuid FROM ${historyTableName} WHERE class = $2 AND created_before_token > $1 AND last_operation IN ('add', 'mod')`,
    [fromToken, className]
  )
  const addUUids = resultAdd.rows.map(item => item.uuid)
  // changed or deleted models whose birth has to have been witnessed at fromToken (created_before_token<=fromToken) keep their tag
  // if the modification is newer than fromToken (operation_before_token >= fromToken)
  const resultKeep = (
    await dbClient.query(
      `SELECT uuid, last_operation FROM ${historyTableName} 
                            WHERE class = $2 AND created_before_token <= $1 AND operation_before_token >= $1 AND last_operation IN ('del', 'mod')`,
      [fromToken, className]
    )
  ).rows
  const delUUids = resultKeep.filter(event => event.last_operation === 'del').map(item => item.uuid)
  const modUuids = resultKeep.filter(event => event.last_operation === 'mod').map(item => item.uuid)
  return {
    add: addUUids,
    mod: modUuids,
    del: delUUids,
  }
}

/**
 * @param {Client} dbClient
 * @param {[*]} events
 * @param {string} className
 * @param {string} historyTableNameEsc
 * @param {string} currentToken we know the event happened before this token
 * @return {Promise<void>}
 */
export async function recordEventsForClass(dbClient, events, className, historyTableNameEsc, currentToken) {
  const historyRecords = events
    .map(evt => ({
      uuid: evt.snapshot.uuid,
      class: className,
      created_before_token: currentToken,
      last_operation: evt.operation,
      operation_before_token: currentToken,
    }))
    .filter(record => record.uuid)

  if (historyRecords.length === 0) return
  await dbClient.query(
    `INSERT INTO ${historyTableNameEsc} (uuid, class, created_before_token, operation_before_token, last_operation)
     SELECT * FROM UNNEST($1::${UUID_TYPE}[], $2::${VARCHAR_255}[], $3::${TOKEN_TYPE}[], $4::${TOKEN_TYPE}[], $5::${VARCHAR_255}[])
     ON CONFLICT (uuid) DO UPDATE SET
       last_operation = EXCLUDED.last_operation,
       operation_before_token = EXCLUDED.operation_before_token`,
    [
      historyRecords.map(r => r.uuid),
      historyRecords.map(r => r.class),
      historyRecords.map(r => r.created_before_token),
      historyRecords.map(r => r.operation_before_token),
      historyRecords.map(r => r.last_operation),
    ]
  )
}

/**
 * return the number of currently valid references for the given model
 * @param dbClient
 * @param {string} className
 * @param {string} historyTableName
 * @returns {Promise<number>}
 */
export async function getValidRefCounts(dbClient, className, historyTableName) {
  // assuming snapshot isolation here
  const result = await dbClient.query(
    `SELECT count(*) AS count FROM ${historyTableName} WHERE class = $1 AND last_operation <> 'del'`,
    [className]
  )
  return Number.parseInt(result.rows[0].count)
}

export class ReferenceStore {
  ref2Uuid = new Map([[NULL_REF, null]])
  uuid2Ref = new Map([[null, NULL_REF]])

  constructor(ref2UuidTableName, lifetimeRef) {
    this.ref2UuidTableName = ref2UuidTableName
    this.lifetimeRef = lifetimeRef
    this._insertStatement = `
      INSERT INTO ${this.ref2UuidTableName} (uuid, ref, lifetime_ref)
        (SELECT *, $3::${REF_TYPE}
         FROM UNNEST($1::${UUID_TYPE}[], $2::${REF_TYPE}[]))
      ON CONFLICT DO NOTHING`
  }

  _recordInMemory(ref, uuid) {
    if (ref === NULL_REF && uuid !== null) {
      throw new Error(`${NULL_REF} should always be associated to null, tried to associate it to ${uuid}.`)
    }
    this.ref2Uuid.set(ref, uuid)
    this.uuid2Ref.set(uuid, ref)
  }

  async bulkRecordUuid(pairs, dbClient) {
    for (const [ref, uuid] of pairs) {
      this._recordInMemory(ref, uuid)
    }
    await dbClient.query(this._insertStatement, [pairs.map(p => p[1]), pairs.map(p => p[0]), this.lifetimeRef])
  }

  /**
   * @param {Iterable<string>} refs
   * @param {Client} dbClient
   * @return {Promise<Map<string, string>>} a map of the found references
   */
  async bulkSearchUuid(refs, dbClient) {
    const refSet = new Set(refs)
    const result = new Map()
    const missingFromMemory = []
    for (const ref of refSet) {
      if (this.ref2Uuid.has(ref)) {
        result.set(ref, this.ref2Uuid.get(ref))
      } else {
        missingFromMemory.push(ref)
      }
    }
    if (missingFromMemory.length > 0) {
      const fromDb = await dbClient.query(
        `SELECT ref, uuid FROM ${this.ref2UuidTableName} WHERE lifetime_ref = $1 AND ref = ANY($2)`,
        [this.lifetimeRef, missingFromMemory]
      )
      if (fromDb.rowCount) {
        for (const dbEntry of fromDb.rows) {
          result.set(dbEntry.ref, dbEntry.uuid)
          this._recordInMemory(dbEntry.ref, dbEntry.uuid)
        }
      }
    }
    return result
  }

  async bulkSearchRef(dbClient, uuids) {
    const result = new Map()
    const missingFromMemory = []
    for (const uuid of uuids) {
      if (this.uuid2Ref.has(uuid)) {
        result.set(uuid, this.uuid2Ref.get(uuid))
      } else {
        missingFromMemory.push(uuid)
      }
    }
    if (missingFromMemory.length > 0) {
      const fromDb = await dbClient.query(
        `SELECT ref, uuid FROM ${this.ref2UuidTableName} WHERE lifetime_ref = $1 AND uuid = ANY($2)`,
        [this.lifetimeRef, missingFromMemory]
      )
      for (const dbEntry of fromDb.rows) {
        result.set(dbEntry.uuid, dbEntry.ref)
        this._recordInMemory(dbEntry.ref, dbEntry.uuid)
      }
    }
    return result
  }
}
