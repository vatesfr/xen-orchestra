'use strict'

const { join, resolve } = require('path')
const { spawn } = require('child_process')
const { check } = require('proper-lockfile')

const CLEAN_VM_QUEUE = (exports.CLEAN_VM_QUEUE = '/xo-vm-backups/.queue/clean-vm/')

const CLI_PATH = resolve(__dirname, 'cli.js')
exports.run = async function runMergeWorker(remotePath) {
  try {
    // TODO: find a way to pass the acquire the lock and then pass it down the worker
    if (await check(join(remotePath, CLEAN_VM_QUEUE))) {
      // already locked, don't start another worker
      return
    }

    spawn(CLI_PATH, {
      cwd: remotePath,
      detached: true,
      stdio: 'inherit',
    }).unref()
  } catch (error) {
    // we usually don't want to throw if the merge worker failed to start
    return error
  }
}
