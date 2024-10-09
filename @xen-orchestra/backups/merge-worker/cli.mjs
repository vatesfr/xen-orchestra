#!/usr/bin/env node
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable n/shebang */

import { ENCRYPTION_KEY } from './_encryptionKey.mjs'

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
// -------------------------------------------------------------------

catchGlobalErrors(createLogger('xo:backups:mergeWorker'))

const { fatal, info, warn } = createLogger('xo:backups:mergeWorker')

// -------------------------------------------------------------------

const main = Disposable.wrap(async function* main(args) {
  const url = new URL('file:///')
  url.pathname = process.cwd

  if (ENCRYPTION_KEY !== undefined) {
    url.searchParams.set('encryptionKey', ENCRYPTION_KEY)
  }

  const handler = yield getSyncedHandler({ url })

  yield handler.lock(CLEAN_VM_QUEUE)

  const adapter = new RemoteAdapter(handler)

  const listRetry = async () => {
    const timeoutResolver = resolve => setTimeout(resolve, 10e3)
    for (let i = 0; i < 10; ++i) {
      const entries = await handler.list(CLEAN_VM_QUEUE)
      if (entries.length !== 0) {
        entries.sort()
        return entries
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
