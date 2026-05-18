import type { UpgradablePackage } from '@vates/types'
import type { PackageManager, RequiredAction, UpgradeResult } from './types.mjs'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'
import { AsyncResource } from 'node:async_hooks'
import { execFile, spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { accessSync, createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { parseUpgradableList, parseAptCacheShow, parseStatusFdLine, detectRequiredAction } from './parse.mjs'

const log = createLogger('xo:xo-server-package-manager:apt')

const APT_GET_PATH = '/usr/bin/apt-get'
const APT_PATH = '/usr/bin/apt'
const APT_CACHE_PATH = '/usr/bin/apt-cache'

type AptResult = {
  exitCode: number | null
  stdoutBuf: string
  stderrBuf: string
  logFile: string
}

/**
 * Run a command and return stdout as a string.
 */
function exec(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { maxBuffer: 10 * 1024 * 1024, env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive', LC_ALL: 'C' } },
      (err, stdout, stderr) => {
        if (err !== null) {
          const error = new Error(
            `Command failed: ${cmd} ${args.join(' ')}${stderr.trim() !== '' ? `\n${stderr.trim()}` : ''}`
          )
          error.cause = err
          reject(error)
          return
        }
        resolve(stdout)
      }
    )
  })
}

export class AptPackageManager implements PackageManager {
  readonly #stateDir: string
  #isRunning = false

  constructor(stateDir: string) {
    this.#stateDir = stateDir
  }

  /**
   * Throws if apt-get is not available on the system.
   */
  checkAvailable(): void {
    try {
      accessSync(APT_GET_PATH)
    } catch {
      throw new Error(`apt-get not found at ${APT_GET_PATH}. This plugin requires a Debian-based system.`)
    }
  }

  /**
   * Refresh the local package index (`apt-get update`).
   */
  async updatePackageList(): Promise<void> {
    await exec(APT_GET_PATH, ['update', '-q'])
  }

  /**
   * List all upgradable packages with full metadata from the local cache.
   *
   * Reads from the already-fetched package index — call `updatePackageList()`
   * first if you need fresh data.
   */
  async listUpgradable(): Promise<UpgradablePackage[]> {
    const stdout = await exec(APT_PATH, ['list', '--upgradable'])
    const partial = parseUpgradableList(stdout)

    if (partial.length === 0) {
      return []
    }

    const packageNames = partial.map(p => p.name!)
    const cacheStdout = await exec(APT_CACHE_PATH, ['show', ...packageNames])
    const cacheData = parseAptCacheShow(cacheStdout)

    const results: UpgradablePackage[] = []
    for (const pkg of partial) {
      const cache = cacheData.get(pkg.name!)
      results.push({
        name: pkg.name!,
        version: pkg.version!,
        installedVersion: pkg.installedVersion!,
        release: pkg.release!,
        description: cache?.description ?? '',
        size: cache?.size ?? 0,
        sourceRepository: cache?.sourceRepository ?? '',
      })
    }

    return results
  }

  /**
   * Upgrade specific packages (or all upgradable) within the current task context.
   * Reports per-package subtasks and overall progress to the parent task via AsyncLocalStorage.
   * Use from a REST route's createAction callback.
   */
  async runUpgrade(packages?: string[]): Promise<void> {
    this.#guardConcurrency()
    this.#isRunning = true
    try {
      const args = ['upgrade', '-y', '-o', 'APT::Status-Fd=3']
      if (packages !== undefined && packages.length > 0) {
        args.push(...packages)
      }
      const { exitCode, stderrBuf } = await this.#runAptGet(args)
      this.#throwOnFailure(exitCode, stderrBuf)
    } finally {
      this.#isRunning = false
    }
  }

  /**
   * Perform a full distribution upgrade within the current task context.
   * Reports per-package subtasks and overall progress to the parent task via AsyncLocalStorage.
   * Use from a REST route's createAction callback.
   */
  async runSystemUpgrade(): Promise<void> {
    this.#guardConcurrency()
    this.#isRunning = true
    try {
      const { exitCode, stderrBuf } = await this.#runAptGet(['dist-upgrade', '-y', '-o', 'APT::Status-Fd=3'])
      this.#throwOnFailure(exitCode, stderrBuf)
    } finally {
      this.#isRunning = false
    }
  }

  /**
   * Upgrade specific packages (or all upgradable). Blocks until completion.
   * For use by the CLI — prefer runUpgrade() from REST route handlers.
   */
  async upgrade(packages?: string[]): Promise<UpgradeResult> {
    this.#guardConcurrency()
    this.#isRunning = true
    try {
      const args = ['upgrade', '-y', '-o', 'APT::Status-Fd=3']
      if (packages !== undefined && packages.length > 0) {
        args.push(...packages)
      }
      return await this.#buildUpgradeResult(await this.#runAptGet(args))
    } finally {
      this.#isRunning = false
    }
  }

  /**
   * Perform a full distribution upgrade. Blocks until completion.
   * For use by the CLI — prefer runSystemUpgrade() from REST route handlers.
   */
  async systemUpgrade(): Promise<UpgradeResult> {
    this.#guardConcurrency()
    this.#isRunning = true
    try {
      return await this.#buildUpgradeResult(await this.#runAptGet(['dist-upgrade', '-y', '-o', 'APT::Status-Fd=3']))
    } finally {
      this.#isRunning = false
    }
  }

  /**
   * Returns true if /var/run/reboot-required exists (set by dpkg after upgrades that need a reboot).
   */
  isRebootRequired(): boolean {
    try {
      accessSync('/var/run/reboot-required')
      return true
    } catch {
      return false
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  #guardConcurrency(): void {
    if (this.#isRunning) {
      throw new Error('Another package operation is already in progress')
    }
  }

  #throwOnFailure(exitCode: number | null, stderrBuf: string): void {
    if (exitCode !== 0) {
      if (stderrBuf.includes('Could not get lock') || stderrBuf.includes('Unable to acquire')) {
        throw new Error('Another package operation is in progress (apt lock held by another process)')
      }
      throw Object.assign(new Error(`apt-get failed with exit code ${exitCode}`), { stderr: stderrBuf })
    }
  }

  /**
   * Spawn apt-get and stream overall progress to the current VatesTask in context.
   * AsyncResource.bind propagates the AsyncLocalStorage context into the Status-Fd callback.
   */
  async #runAptGet(args: string[]): Promise<AptResult> {
    await mkdir(this.#stateDir, { recursive: true })

    const timestamp = Date.now()
    const logFile = join(this.#stateDir, `upgrade-${timestamp}.log`)
    const logStream = createWriteStream(logFile, { flags: 'a' })

    const child = spawn(APT_GET_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
      env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive', LC_ALL: 'C' },
    })

    if (child.pid === undefined) {
      logStream.destroy()
      throw new Error('Failed to spawn apt-get process')
    }

    let stdoutBuf = ''
    let stderrBuf = ''
    let statusFdBuf = ''

    child.stdout!.on('data', (data: Buffer) => {
      const text = data.toString()
      stdoutBuf += text
      logStream.write(text)
    })

    child.stderr!.on('data', (data: Buffer) => {
      const text = data.toString()
      stderrBuf += text
      logStream.write(`[stderr] ${text}`)
    })

    const statusFd = child.stdio[3]
    if (statusFd !== undefined && statusFd !== null && 'on' in statusFd) {
      // AsyncResource.bind captures the current AsyncLocalStorage context so that
      // Task.set() resolves the correct parent task inside the EventEmitter callback.
      ;(statusFd as NodeJS.ReadableStream).on(
        'data',
        AsyncResource.bind((data: Buffer) => {
          statusFdBuf += data.toString()
          const lines = statusFdBuf.split('\n')
          statusFdBuf = lines.pop()!
          for (const line of lines) {
            const progress = parseStatusFdLine(line)
            if (progress !== undefined) {
              Task.set('progress', progress.percentage)
            }
          }
        })
      )
    }

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on('error', err => {
        logStream.end()
        const error = new Error('apt-get process error')
        error.cause = err
        reject(error)
      })
      child.on('close', code => {
        logStream.end()
        resolve(code)
      })
    })

    if (exitCode === 0) {
      Task.set('progress', 100)
    }

    return { exitCode, stdoutBuf, stderrBuf, logFile }
  }

  /**
   * Build an UpgradeResult from a completed apt-get run (CLI path only).
   */
  async #buildUpgradeResult({ exitCode, stdoutBuf, stderrBuf, logFile }: AptResult): Promise<UpgradeResult> {
    this.#throwOnFailure(exitCode, stderrBuf)

    const packagesUpgraded: string[] = []
    for (const line of stdoutBuf.split('\n')) {
      const match = line.match(/^Setting up (\S+)\s/)
      if (match !== null) packagesUpgraded.push(match[1]!)
    }

    const requiredAction: RequiredAction = await detectRequiredAction(packagesUpgraded)
    log.info('Upgrade completed', { packagesUpgraded: packagesUpgraded.length, requiredAction })

    return { success: true, packagesUpgraded, requiredAction, logFile }
  }
}
