#!/usr/bin/env node

const { catchGlobalErrors } = require('@xen-orchestra/log/configure.js')
const { createLogger } = require('@xen-orchestra/log')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { join } = require('path')
const Disposable = require('promise-toolbox/Disposable')
const min = require('lodash/min')

const { getVmBackupDir } = require('../_getVmBackupDir.js')
const { RemoteAdapter } = require('../RemoteAdapter.js')

const { CLEAN_VM_QUEUE } = require('./index.js')

// -------------------------------------------------------------------

catchGlobalErrors(createLogger('xo:backups:mergeWorker'))

const { fatal, info, warn } = createLogger('xo:backups:mergeWorker')

// -------------------------------------------------------------------

const main = Disposable.wrap(async function* main(args) {
  const handler = yield getSyncedHandler({ url: 'file://' + process.cwd() })

  yield handler.lock(CLEAN_VM_QUEUE)

  const adapter = new RemoteAdapter(handler)

  const listRetry = async () => {
    const timeoutResolver = resolve => setTimeout(resolve, 10e3)
    for (let i = 0; i < 10; ++i) {
      const entries = await handler.list(CLEAN_VM_QUEUE)
      if (entries.length !== 0) {
        return entries
      }
      await new Promise(timeoutResolver)
    }
  }

  let taskFiles
  while ((taskFiles = await listRetry()) !== undefined) {
    const taskFileBasename = min(taskFiles)
    const taskFile = join(CLEAN_VM_QUEUE, '_' + taskFileBasename)

    // move this task to the end
    await handler.rename(join(CLEAN_VM_QUEUE, taskFileBasename), taskFile)
    try {
      const vmDir = getVmBackupDir(String(await handler.readFile(taskFile)))
      await adapter.cleanVm(vmDir, { merge: true, onLog: info, remove: true })

      handler.unlink(taskFile).catch(error => warn('deleting task failure', { error }))
    } catch (error) {
      warn('failure handling task', { error })
    }
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
