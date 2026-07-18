import { Pool } from 'pg'
import { createLogger } from '@xen-orchestra/log'
import { getDbObjectsForSchemas, getSchemaPrefixes, loadXapiDefinition } from './conmon_configuration.mjs'
import { createClassNameFixer, EventStore } from './event_store.mjs'
import { ensureSchemasExistsWithoutConflict, withClient } from './sql.mjs'
const { info } = createLogger('xo-pg')

function getNonSessionMethods(classDict) {
  const result = new Set()
  for (const c of Object.values(classDict)) {
    const messages = c.messages.filter(m => m.params.length === 0 || m.params[0].type !== 'session ref')
    for (const m of messages) {
      result.add(c.name + '.' + m.name)
    }
  }
  return result
}

/**
 * confusing params
 * @param poolUuid XAPI host pool UUID
 * @param poolRef XAPI host pool reference
 * @param dbPool DB connection pool
 */
async function prepareForPool(poolUuid, poolRef, dbPool) {
  return await withClient(dbPool, async dbClient => {
    const schemas = await ensureSchemasExistsWithoutConflict(dbClient, poolUuid, getSchemaPrefixes())
    const dbObjects = await getDbObjectsForSchemas(schemas)
    for (const statement of dbObjects.getAllTheDDL()) {
      await dbClient.query(statement)
    }
    const classNameFixer = createClassNameFixer(dbObjects.CLASSES_DICT)
    const eventStore = new EventStore(dbObjects.XAPIDBCLASSES, dbObjects.EVENT_MODELS, poolRef, dbObjects.VIEW_NAMES)
    return { classNameFixer, eventStore, dbObjects }
  })
}

async function firstEventFrom(dbPool, sessionId, realTransport, classes, classNameFixer, eventStore) {
  await withClient(dbPool, async dbClient => {
    // we need to do an initial load with events.from(), because pulling the objects class by class with
    // get_all_records() doesn't allow keeping all the foreign constraints intact during the insert.
    info('initialLoad...')
    const initialLoad = await realTransport('event.from', [sessionId, classes, '', 0.0])
    info('initialLoad done')
    const fixedNames = classNameFixer(initialLoad)
    await eventStore.ingestEvents(dbClient, fixedNames, sessionId)
  })
}

/**
 * Wraps a xen API transport and save the entities in a Postgres DB on the fly.
 * @param pgUrl Postgres connection string, this function will create its own schemas and tables in it.
 * @param createRealTransport
 * @return {function(*): function(*, *): Promise<*>}
 */
export async function createPgTransport(pgUrl, createRealTransport) {
  const dbPool = new Pool({ connectionString: pgUrl })
  info('created interceptor transport and connected to DB')
  const classDict = await loadXapiDefinition()
  const nonSessionMethods = getNonSessionMethods(classDict)
  return function (prm) {
    const realTransport = createRealTransport(prm)
    let eventStore = null
    let classNameFixer = null
    let sessionId = null
    return async (method, params) => {
      const result = await realTransport(method, params)
      if (sessionId === null) {
        if (method === 'session.login_with_password') {
          sessionId = result
        } else if (!nonSessionMethods.has(method)) {
          sessionId = params[0]
        }
        if (sessionId !== null) {
          info(`got session ID from ${method}`)
        }
      }
      if (method === 'pool.get_all_records') {
        if (eventStore === null && Object.keys(result).length) {
          const [firstPoolRef, firstPoolRecord] = Object.entries(result)[0]
          let dbObjects
          ;({ classNameFixer, eventStore, dbObjects } = await prepareForPool(
            firstPoolRecord.uuid,
            firstPoolRef,
            dbPool
          ))
          const classes = Object.keys(dbObjects.XAPIDBCLASSES)
          await firstEventFrom(dbPool, params[0], realTransport, classes, classNameFixer, eventStore)
        }
      }
      if (method === 'event.from' && eventStore) {
        const fixedNames = classNameFixer(result)
        await withClient(dbPool, async dbClient => {
          await eventStore.ingestEvents(dbClient, fixedNames, params[0])
        })
      }
      return result
    }
  }
}
