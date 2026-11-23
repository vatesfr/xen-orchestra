#!/usr/bin/env node
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable n/shebang */

import { asyncEach } from '@vates/async-each'
import { catchGlobalErrors } from '@xen-orchestra/log/configure'
import { createLogger } from '@xen-orchestra/log'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { join } from 'node:path'
import { load as loadConfig } from 'app-conf'
import Disposable from 'promise-toolbox/Disposable'

import { getVmBackupDir } from '../_getVmBackupDir.mjs'
import { RemoteAdapter } from '../RemoteAdapter.mjs'

import { CLEAN_VM_QUEUE } from './index.mjs'

const APP_NAME = 'xo-merge-worker'
const APP_DIR = new URL('.', import.meta.url).pathname

// delay before retrying tasks whose VM backup dir was locked by another process
const ELOCKED_RETRY_DELAY = 5 * 60e3
// -------------------------------------------------------------------

catchGlobalErrors(createLogger('xo:backups:mergeWorker'))

const { debug, fatal, info, warn } = createLogger('xo:backups:mergeWorker')

// -------------------------------------------------------------------

const main = Disposable.wrap(async function* main(args) {
  const handler = yield getSyncedHandler({ url: 'file://' + process.cwd() })

  yield handler.lock(CLEAN_VM_QUEUE)

  const adapter = new RemoteAdapter(handler)

  // task file basename → timestamp before which the task must not be retried
  //
  // used for tasks whose VM backup dir was locked, so that they are delayed
  // without blocking the other tasks
  const retryAfter = new Map()

  const listRetry = async () => {
    const timeoutResolver = resolve => setTimeout(resolve, 10e3)
    for (let i = 0; i < 10; ++i) {
      const entries = await handler.list(CLEAN_VM_QUEUE)

      // forget delays of tasks which are no longer in the queue
      for (const entry of retryAfter.keys()) {
        if (!entries.includes(entry)) {
          retryAfter.delete(entry)
        }
      }

      const now = Date.now()
      const readyEntries = entries.filter(entry => {
        const retryTime = retryAfter.get(entry)
        return retryTime === undefined || retryTime <= now
      })

      if (readyEntries.length !== 0) {
        readyEntries.sort()
        return readyEntries
      }

      // only delayed tasks remain: keep waiting for them, the queue is not empty
      if (entries.length !== 0) {
        --i
      }
      await new Promise(timeoutResolver)
    }
  }

  let taskFiles
  while ((taskFiles = await listRetry()) !== undefined) {
    const { concurrency } = await loadConfig(APP_NAME, {
      appDir: APP_DIR,
      ignoreUnknownFormats: true,
    })
    await asyncEach(
      taskFiles,
      async taskFileBasename => {
        const previousTaskFile = join(CLEAN_VM_QUEUE, taskFileBasename)
        const taskFile = join(CLEAN_VM_QUEUE, '_' + taskFileBasename)

        // move this task to the end
        try {
          await handler.rename(previousTaskFile, taskFile)
        } catch (error) {
          // this error occurs if the task failed too many times (i.e. too many `_` prefixes)
          // there is nothing more that can be done
          if (error.code === 'ENAMETOOLONG') {
            await handler.unlink(previousTaskFile)
            warn('dropping task after too many failures', { taskFile: previousTaskFile })

            // don't crash the whole worker for a single task
            return
          }

          throw error
        }

        try {
          const vmDir = getVmBackupDir(String(await handler.readFile(taskFile)))
          try {
            await adapter.cleanVm(vmDir, { merge: true, logInfo: info, logWarn: warn, remove: true })
          } catch (error) {
            // consider the clean successful if the VM dir is missing
            if (error.code !== 'ENOENT') {
              throw error
            }
          }

          handler.unlink(taskFile).catch(error => warn('deleting task failure', { error }))
        } catch (error) {
          if (error.code === 'ELOCKED') {
            // another process (backup, synchronous merge…) is handling this VM,
            // this is not a failure: restore the task name to not count this attempt
            retryAfter.set(taskFileBasename, Date.now() + ELOCKED_RETRY_DELAY)
            debug('VM backup dir is locked, the task will be retried later', { taskFile: previousTaskFile })
            await handler
              .rename(taskFile, previousTaskFile)
              .catch(error => warn('restoring task name failure', { error, taskFile }))
            return
          }

          warn('failure handling task', { error })
        }
      },
      { concurrency }
    )
  }
})

info('starting')
main(process.argv.slice(2)).then(
  () => {
    info('bye :-)')
  },
  error => {
    fatal(error)

    process.exit(1)
  }
)
