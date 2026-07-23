import { createLogger } from '@xen-orchestra/log'
import { Pool } from 'pg'
import { getDbObjectsForSchemas, getSchemaPrefixes, loadXapiDefinition } from './conmon_configuration.mjs'
import { createClassNameFixer, EventStore } from './event_store.mjs'
import { ensureSchemasExistsWithoutConflict, withClient } from './sql.mjs'
import { ALL_LIFE_CYCLE_STATES } from './xapi.mjs'

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
 * @param classDict
 */
async function prepareForPool(poolUuid, poolRef, dbPool, classDict) {
  return await withClient(dbPool, async dbClient => {
    const schemas = await ensureSchemasExistsWithoutConflict(dbClient, poolUuid, getSchemaPrefixes())
    const dbObjects = await getDbObjectsForSchemas(schemas, classDict)
    for (const statement of dbObjects.getAllTheDDL()) {
      await dbClient.query(statement)
    }
    const classNameFixer = createClassNameFixer(dbObjects.CLASSES_DICT)
    const eventStore = new EventStore(dbObjects.XAPIDBCLASSES, dbObjects.EVENT_MODELS, poolRef, dbObjects.VIEW_NAMES)
    return { classNameFixer, eventStore, dbObjects }
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
  const classDict = await loadXapiDefinition(ALL_LIFE_CYCLE_STATES)
  const nonSessionMethods = getNonSessionMethods(classDict)
  return function (prm) {
    const realTransport = createRealTransport(prm)
    let eventStore = null
    let classNameFixer = null
    let sessionId = null
    let xapiDBClasses
    async function refillDBEvents(dbPool, sessionId, classes, timeout = 0.0) {
      // using separate db client for each action because event.from might be blocking
      const lastTokenFromDB = await withClient(dbPool, async dbClient => await eventStore.getLastToken(dbClient))
      // we need to do an initial load with events.from(), because pulling the objects class by class with
      // get_all_records() doesn't allow keeping all the foreign constraints intact during the insert.
      info('refilling event store... ', { token: lastTokenFromDB, timeout })
      const initialLoad = await realTransport('event.from', [sessionId, classes, lastTokenFromDB || '', timeout])
      const fixedNames = classNameFixer(initialLoad)
      await withClient(dbPool, async dbClient => {
        await eventStore.ingestEvents(dbClient, fixedNames, sessionId)
        info('refill done', fixedNames.token)
      })
    }
    return async (method, params) => {
      if (method === 'event.from' && eventStore) {
        info(`intercepted ${method}`)
        const [sessionId, xoCovetedClasses, token, timeout] = params
        const paramClassesSet = new Set(xoCovetedClasses)
        const fromJson = new Set(xapiDBClasses)
        info(`XO wants to get, but xo-pg doesn't track: `, paramClassesSet.difference(fromJson))
        info(`xo-pg tracks but XO doesn't: `, fromJson.difference(paramClassesSet))
        await refillDBEvents(dbPool, sessionId, xoCovetedClasses, timeout)
        const result = await withClient(dbPool, async dbClient => await eventStore.eventsFrom(dbClient, token))
        info('computed events between', { from: params[2], to: result.token, timeout: params[3] })
        return result
      }
      const result = await realTransport(method, params)
      info(`forwarded ${method}`)
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
      if (method === 'event.inject') {
        info(`injected ${result}`)
      }
      if (method === 'system.listMethods') {
        const classes = result.filter(m => m.endsWith('.get_all_records')).map(m => m.slice(0, m.indexOf('.')))
        info(`system.listMethods`, classes)
      }
      if (method === 'pool.get_all_records') {
        if (eventStore === null && Object.keys(result).length) {
          const [firstPoolRef, firstPoolRecord] = Object.entries(result)[0]
          let dbObjects
          ;({ classNameFixer, eventStore, dbObjects } = await prepareForPool(
            firstPoolRecord.uuid,
            firstPoolRef,
            dbPool,
            classDict
          ))
          xapiDBClasses = Object.values(dbObjects.CLASSES_DICT)
            .filter(c => c.messages.find(m => m.name === 'get_all_records'))
            .map(c => c.name)
          await refillDBEvents(dbPool, params[0], xapiDBClasses)
        }
      }

      return result
    }
  }
}
