import { join } from 'node:path'
import { spawn } from 'child_process'
import { check } from 'proper-lockfile'

export const CLEAN_VM_QUEUE = '/xo-vm-backups/.queue/clean-vm/'

const CLI_PATH = new URL('cli.mjs', import.meta.url).pathname

export const run = async function runMergeWorker(remotePath, { encryptionKey }) {
  try {
    // TODO: find a way to pass the acquire the lock and then pass it down the worker
    if (await check(join(remotePath, CLEAN_VM_QUEUE))) {
      // already locked, don't start another worker
      return
    }

    const cp = spawn(CLI_PATH, {
      cwd: remotePath,
      env: {
        ...process.env,
        ENCRYPTION_KEY: encryptionKey,
      },
      detached: true,
      stdio: ['pipe', 'inherit', 'inherit'],
    })
    cp.stdin.end(encryptionKey)
    cp.unref()
  } catch (error) {
    // we usually don't want to throw if the merge worker failed to start
    return error
  }
}
