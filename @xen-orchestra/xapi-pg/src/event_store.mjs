import { escapeLiteral } from 'pg'
import { eventsFrom, getValidRefCounts, recordEventsForClass, ReferenceStore } from './db_history.mjs'
import { NULL_REF } from './xapi.mjs'

function groupByEntries(obj, keySelector) {
  return Object.entries(Object.groupBy(obj, keySelector))
}

export class EventStore {
  /**
   * @typedef {{type: any, value: Record, attr: string, uuid: string}} DeferredAssociation
   */
  /** @type {{[name:string]: XapiDBClass}} */
  classesDict

  constructor(
    classesDict,
    { eventTableName, historyTableName, ref2UuidTableName },
    refLifetimeRef,
    viewNames,
    refStore = new ReferenceStore(ref2UuidTableName, refLifetimeRef)
  ) {
    this.classesDict = classesDict
    this.eventTableName = eventTableName
    this.historyTableName = historyTableName
    this.ref2UuidTableName = ref2UuidTableName
    // this is the pool reference, as long as it stays constant, we assume that all the other references stay alive
    // if it changes, we'll have to ask again all the references from XAPI
    this.refLifetimeRef = refLifetimeRef
    this.viewNames = viewNames
    this.refStore = refStore
  }

  /**
   * @typedef FromEvent
   * @property {string} id
   * @property {string} timestamp
   * @property {string} class
   * @property {string} ref
   * @property {string} operation
   * @property {{uuid}|undefined} snapshot
   */

  /**
   xapi -> DB
   The events classes are supposed to be in the correct case.
   * @param {Client} dbClient
   * @param {{token, events:[FromEvent], valid_ref_counts}} eventResult
   * @param {string} previousToken
   * @param sessionId
   * @return {Promise<Set<string>>} a set of the references we couldn't resolve
   */
  async ingestEvents(dbClient, eventResult, previousToken, sessionId) {
    const refStore = this.refStore
    const currentToken = eventResult.token
    let events = eventResult.events
    // some classes are ignored because of API filtering
    events = events.filter(event => event.class in this.classesDict)
    const addEvents = events.filter(e => e.operation === 'add')
    const modEvents = events.filter(e => e.operation === 'mod')
    await dbClient.query(`BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE`)
    let transactionOngoing = true
    try {
      await dbClient.query('SET LOCAL synchronous_commit = off;')
      const survivingEvents = addEvents.concat(modEvents)
      const newrefs2Uuid = survivingEvents.map(e => [e.ref, e.snapshot.uuid])
      const survivingEventsByClass = Object.groupBy(survivingEvents, e => e.class)
      /**
       * a dict of class-> records for added or modified records, both cases will be handled by MERGE.
       */
      const survivingObjectsByClass = Object.fromEntries(
        Object.entries(survivingEventsByClass).map(([cl, evts]) => [cl, evts.map(e => e.snapshot)])
      )
      const linkedReferences = []
      for (const [className, records] of Object.entries(survivingObjectsByClass)) {
        linkedReferences.push(...(await this.classesDict[className].persistNonRefRecordsToDB(dbClient, records)))
      }
      await refStore.bulkRecordUuid(newrefs2Uuid, dbClient)
      const resolvedRefs = await refStore.bulkSearchUuid(linkedReferences, dbClient)
      const unknownRef = new Set()
      const ref2uuid = ref => {
        if (!resolvedRefs.has(ref)) {
          unknownRef.add(ref)
        }
        return resolvedRefs.get(ref)
      }
      for (const [className, records] of Object.entries(survivingObjectsByClass)) {
        await this.classesDict[className].persistRefRecordsToDB(dbClient, records, ref2uuid)
      }
      const { events: filteredEvents, delEvents } = await this._prepareDelEvents(dbClient, events, refStore)
      // record event history now, before the ref2Uuid cache is cleared of deleted objects
      await dbClient.query(`INSERT INTO ${this.eventTableName} (token, content) VALUES ($1, $2)`, [
        currentToken,
        JSON.stringify({ ...eventResult, events: [] }),
      ])
      for (const [className, evts] of groupByEntries(filteredEvents, e => e.class)) {
        await recordEventsForClass(dbClient, evts, className, this.historyTableName, currentToken)
      }
      for (const event of delEvents) {
        if (event.snapshot?.uuid) {
          // let's hope all the "delete cascade" are well configured.
          await dbClient.query(
            `DELETE
             FROM ${this.classesDict[event.class].getTableNameEsc()}
             WHERE uuid = $1`,
            [event.snapshot.uuid]
          )
        }
      }
      // can't call NOTIFY with a bound string
      await dbClient.query(
        `SELECT pg_notify('event', ${escapeLiteral(JSON.stringify({ token: currentToken, sessionId, poolRef: this.refLifetimeRef }))});`
      )
      await dbClient.query('COMMIT')
      transactionOngoing = false
      return unknownRef
    } catch (error) {
      await dbClient.query('ROLLBACK')
      transactionOngoing = false
      throw new Error('Rollback', { cause: error })
    } finally {
      if (transactionOngoing) {
        // somebody returned without rolling back the transaction
        await dbClient.query('ROLLBACK')
      }
    }
  }

  /**
   * remove orphaned deletion events, and record the uuid of the kept ones.
   * @param dbClient
   * @param events
   * @param {ReferenceStore} refStore
   * @returns {Promise<{events, delEvents: *}>}
   */
  async _prepareDelEvents(dbClient, events, refStore) {
    /* event= {
          id: '31790213',
          timestamp: '0.0',
          class: 'task',
          operation: 'del',
          ref: 'OpaqueRef:18d174b9-3ce5-4b91-92c5-1906fdc1294b'
          snapshot: {uuid: ...} // we're adding it
        } */
    let delEvents = events.filter(e => e.operation === 'del')
    // we need to get the uuid for the deleted objects, other events have it in the snapshot
    const delEventRefs = delEvents.map(e => e.ref)
    const delEventUuids = await refStore.bulkSearchUuid(delEventRefs, dbClient)
    // if we received a delete event for an entity we don't have in DB, we just ignore it
    const lostDeletionEventIds = new Set()
    for (const event of delEvents) {
      if (delEventUuids.has(event.ref)) {
        // create a fake snapshot
        event.snapshot = { uuid: delEventUuids.get(event.ref) }
      } else {
        lostDeletionEventIds.add(event.id)
      }
    }
    delEvents = delEvents.filter(e => !lostDeletionEventIds.has(e.id))
    events = events.filter(e => !lostDeletionEventIds.has(e.id))
    return { events, delEvents }
  }

  async getViewRecordsForClass(dbClient, viewName, uuids) {
    let where = ''
    let bind = []
    if (uuids !== null) {
      where = `WHERE uuid = ANY ($1)`
      bind = [uuids]
    }
    return (
      await dbClient.query(
        `SELECT *
                 FROM ${viewName} ${where}`,
        bind
      )
    ).rows
  }

  /**
   *
   * @param dbClient
   * @param token
   * @param xapiClass
   * @param historyTableName
   * @param viewName
   * @returns {Promise<{class: any, add: *[], mod: *[], del: string[]}>}
   */
  async eventsForClass(dbClient, token, xapiClass, historyTableName, viewName) {
    const res = await eventsFrom(dbClient, historyTableName, xapiClass.name, token)
    const snapshotUuids = res.add.concat(res.mod)
    const addSet = new Set(res.add)
    const modSet = new Set(res.mod)
    const result = { class: xapiClass, add: [], mod: [], del: res.del }
    if (snapshotUuids.length) {
      for (const record of await this.getViewRecordsForClass(dbClient, viewName, snapshotUuids)) {
        if (addSet.has(record.uuid)) {
          result.add.push(record)
        }
        if (modSet.has(record.uuid)) {
          result.mod.push(record)
        }
      }
    }
    return result
  }

  /**
   DB->XAPI
   @return {Promise<{events:FromEvent[], token:string,valid_ref_counts:Object<string, int>}>}
   */
  async eventsFrom(dbClient, token) {
    const valid_ref_counts = {}
    const lastTokenRow = (await dbClient.query(`SELECT token FROM ${this.eventTableName} ORDER BY token DESC LIMIT 1`))
      .rows[0]
    const lastToken = lastTokenRow.token
    const changesPerClass = []
    for (const clsName of Object.keys(this.classesDict)) {
      const cls = this.classesDict[clsName]
      const clsHistoryTableName = this.historyTableName
      const clsView = this.viewNames.get(clsName)
      const changes = await this.eventsForClass(dbClient, token, cls, clsHistoryTableName, clsView)
      changesPerClass.push({
        class: cls,
        addRecords: changes.add,
        modRecords: changes.mod,
        records: changes.add.concat(changes.mod),
        delUuids: changes.del,
      })
      valid_ref_counts[clsName] = await getValidRefCounts(dbClient, clsName, clsHistoryTableName)
    }
    const uuidToSearch = []
    for (const batch of changesPerClass) {
      uuidToSearch.push(...batch.delUuids)
      uuidToSearch.push(...batch.class.getRefsFromRecords(batch.records))
      uuidToSearch.push(...batch.records.map(r => r.uuid))
    }
    const refs = await this.refStore.bulkSearchRef(dbClient, uuidToSearch)
    const addResult = []
    const modResult = []
    const delResult = []
    for (const batch of changesPerClass) {
      const del = batch.delUuids.map(uuid => refs.get(uuid))
      delResult.push(
        ...del.map(ref => ({
          id: 'lol',
          timestamp: '0.0',
          class: batch.class.name,
          operation: 'del',
          ref,
        }))
      )
      const converter = uuid => (uuid == null ? NULL_REF : refs.get(uuid))
      batch.class.db2XapiRecords(batch.records, converter)
      addResult.push(
        ...batch.addRecords.map(rec => ({
          id: 'lol',
          timestamp: '0.0',
          class: batch.class.name,
          operation: 'add',
          ref: refs.get(rec.uuid),
          snapshot: rec,
        }))
      )
      modResult.push(
        ...batch.modRecords.map(rec => ({
          id: 'lol',
          timestamp: '0.0',
          class: batch.class.name,
          operation: 'mod',
          ref: refs.get(rec.uuid),
          snapshot: rec,
        }))
      )
    }
    return { token: lastToken, events: addResult.concat(modResult).concat(delResult), valid_ref_counts }
  }

  /**
   * convert in place the uuid in the records to a reference
   * @param dbClient
   * @param batchPerClass
   * @returns {Promise<{batchPerClass, converter: (function(*): string|any)}>} batchPerClass is the input, the converter can be used to convert the record uuids themselves
   */
  async convertBatchOfViewRecords(dbClient, batchPerClass) {
    const uuidToSearch = []
    for (const [className, records] of Object.entries(batchPerClass)) {
      const cls = this.classesDict[className]
      uuidToSearch.push(...cls.getRefsFromRecords(records))
      uuidToSearch.push(...records.map(r => r.uuid))
    }
    const refs = await this.refStore.bulkSearchRef(dbClient, uuidToSearch)
    const converter = uuid => (uuid == null ? NULL_REF : refs.get(uuid))
    for (const [className, records] of Object.entries(batchPerClass)) {
      const cls = this.classesDict[className]
      cls.db2XapiRecords(records, converter)
    }
    return { batchPerClass, converter }
  }

  async get_all_records(dbClient, className) {
    const cls = this.classesDict[className]
    const records = await this.getViewRecordsForClass(dbClient, cls.viewNameEsc, null)
    const { converter } = await this.convertBatchOfViewRecords(dbClient, { [className]: records })
    return Object.fromEntries(records.map(rec => [converter(rec.uuid), rec]))
  }
}
