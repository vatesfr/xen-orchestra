import { Pool } from 'pg'
import { createLogger } from '@xen-orchestra/log'
import { getDbObjectsForSchemas, getSchemaPrefixes } from './conmon_configuration.mjs'
import { createClassNameFixer, EventStore } from './event_store.mjs'
import { ensureSchemasExistsWithoutConflict, withClient } from './sql.mjs'
const { info } = createLogger('xo-pg')
/**
 * Wraps a xen API transport and save the entities in a Postgres DB on the fly.
 * @param pgUrl Postgres connection string, this function will create its own schemas and tables in it.
 * @param createRealTransport
 * @return {function(*): function(*, *): Promise<*>}
 */
export function createPgTransport(pgUrl, createRealTransport) {
  const dbPool = new Pool({ connectionString: pgUrl })
  return function (prm) {
    const realTransport = createRealTransport(prm)
    let eventStore = null
    let classNameFixer = null
    return async (method, params) => {
      const result = await realTransport(method, params)
      if (method === 'pool.get_all_records') {
        if (eventStore === null && Object.keys(result).length) {
          const [firstPoolRef, firstPoolRecord] = Object.entries(result)[0]
          await withClient(dbPool, async dbClient => {
            const schemas = await ensureSchemasExistsWithoutConflict(
              dbClient,
              firstPoolRecord.uuid,
              getSchemaPrefixes()
            )
            const dbObjects = await getDbObjectsForSchemas(schemas)
            for (const statement of dbObjects.getAllTheDDL()) {
              await dbClient.query(statement)
            }
            classNameFixer = createClassNameFixer(dbObjects.CLASSES_DICT)
            eventStore = new EventStore(
              dbObjects.XAPIDBCLASSES,
              dbObjects.EVENT_MODELS,
              firstPoolRef,
              dbObjects.VIEW_NAMES
            )
            // we need to do an initial load with events.from(), because pulling the objects class by class with
            // get_all_records() doesn't allow keeping all the foreign constraints intact during the insert.
            info('initialLoad...')
            const initialLoad = await realTransport('event.from', [
              params[0],
              Object.keys(dbObjects.XAPIDBCLASSES),
              '',
              0.0,
            ])
            info('initialLoad done')
            const fixedNames = classNameFixer(initialLoad)
            await eventStore.ingestEvents(dbClient, fixedNames, params[0])
          })
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
