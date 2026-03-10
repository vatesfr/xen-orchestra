import fs from 'node:fs/promises'
import * as File from './file.mjs'
import assert from 'node:assert'
import { join } from 'node:path'
import { createLogger } from '@xen-orchestra/log'
import { type RemoteConfig } from './_loadConfig.mjs'
import { watchRemote as startRemoteWatcher } from './_watcher.mjs'

const { debug, info, warn } = createLogger('xen-orchestra:immutable-backups:remote')

// Verify that the remote filesystem supports immutability by creating,
// modifying, locking, and unlocking a temporary test file.
async function test(remotePath: string): Promise<void> {
  await fs.readdir(remotePath)

  const testPath = join(remotePath, '.test-immut')
  // cleanup
  try {
    await File.liftImmutability(testPath)
    await fs.unlink(testPath)
  } catch {
    // cleanup can fail if it's the first test — not an issue
  }
  // can create, modify and delete a file
  await fs.writeFile(testPath, `test immut ${new Date()}`)
  await fs.writeFile(testPath, `test immut change 1 ${new Date()}`)
  await fs.unlink(testPath)

  // cannot modify or delete an immutable file
  await fs.writeFile(testPath, `test immut ${new Date()}`)
  await File.makeImmutable(testPath)
  await assert.rejects(fs.writeFile(testPath, `test immut change 2  ${new Date()}`), { code: 'EPERM' })
  await assert.rejects(fs.unlink(testPath), { code: 'EPERM' })
  // can modify and delete a file after lifting immutability
  await File.liftImmutability(testPath)

  await fs.writeFile(testPath, `test immut change 3 ${new Date()}`)
  await fs.unlink(testPath)
}

// Start watching a backup remote for new files and make them immutable as they are written.
export async function watchRemote(
  remoteId: string,
  { root, immutabilityDuration }: RemoteConfig
): Promise<{ close: () => void }> {
  debug('got config ', { remoteId, root, immutabilityDuration })

  // test if fs supports immutability
  await test(root)

  // Write the immutability settings file and lock it so it cannot be tampered with.
  const settingPath = join(root, 'immutability.json')
  // Lift first in case it was left immutable from a previous run.
  try {
    await fs.access(settingPath)
    await File.liftImmutability(settingPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      info('error lifting immutability on current settings', { error })
    }
  }
  await fs.writeFile(
    settingPath,
    JSON.stringify({
      since: Date.now(),
      immutable: true,
      duration: immutabilityDuration,
    })
  )
  await File.makeImmutable(settingPath)

  const close = await startRemoteWatcher(root, err => warn('watcher error', { err }))

  return { close }
}
