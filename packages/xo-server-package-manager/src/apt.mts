import type { UpgradablePackage } from '@vates/types'
import type { OperationState, UpgradeProgress, UpgradeResult } from './types.mjs'
import { createLogger } from '@xen-orchestra/log'
import { execFile, spawn } from 'node:child_process'
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { accessSync, createWriteStream, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { parseUpgradableList, parseAptCacheShow, parseStatusFdLine, detectRequiredAction } from './parse.mjs'

const log = createLogger('xo:xo-server-package-manager:apt')

const APT_GET_PATH = '/usr/bin/apt-get'
const APT_PATH = '/usr/bin/apt'
const APT_CACHE_PATH = '/usr/bin/apt-cache'

const OPERATION_FILE = 'operation.json'
const PROGRESS_FILE = 'progress.json'

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
          const error = new Error(`Command failed: ${cmd} ${args.join(' ')}`)
          error.cause = err
          reject(error)
          return
        }
        resolve(stdout)
      }
    )
  })
}

/**
 * Check if a process with the given pid is alive.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export class AptPackageManager {
  readonly #stateDir: string

  constructor(stateDir: string) {
    this.#stateDir = stateDir
  }

  /**
   * Throws if apt-get is not available on the system.
   */
  checkAptAvailable(): void {
    try {
      // Synchronous check — called once at plugin load
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

    // Get full metadata via apt-cache show
    const packageNames = partial.map(p => p.name!)
    const cacheStdout = await exec(APT_CACHE_PATH, ['show', ...packageNames])
    const cacheData = parseAptCacheShow(cacheStdout)

    // Merge the two data sources
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
   * Upgrade specific packages (or all upgradable if none specified).
   * Uses `apt-get upgrade -y`.
   */
  async upgrade(packages?: string[]): Promise<UpgradeResult> {
    const args = ['upgrade', '-y', '-o', 'APT::Status-Fd=3']
    if (packages !== undefined && packages.length > 0) {
      args.push(...packages)
    }
    return this.#runAptGet(args, 'upgrade', packages)
  }

  /**
   * Perform a full distribution upgrade.
   * Uses `apt-get dist-upgrade -y`.
   */
  async systemUpgrade(): Promise<UpgradeResult> {
    const args = ['dist-upgrade', '-y', '-o', 'APT::Status-Fd=3']
    return this.#runAptGet(args, 'systemUpgrade')
  }

  /**
   * Get the status of a running or interrupted operation.
   * Returns null if idle (no operation in progress).
   */
  getOperationStatus(): (OperationState & { progress?: UpgradeProgress }) | null {
    const operationPath = join(this.#stateDir, OPERATION_FILE)
    const progressPath = join(this.#stateDir, PROGRESS_FILE)

    let stateJson: string
    try {
      stateJson = readFileSync(operationPath, 'utf-8')
    } catch {
      return null
    }

    let state: OperationState
    try {
      state = JSON.parse(stateJson)
    } catch {
      log.warn('Corrupt operation file, removing', { path: operationPath })
      try {
        unlinkSync(operationPath)
      } catch {
        // ignore cleanup failure
      }
      return null
    }

    // Check if the process is still alive
    const alive = isProcessAlive(state.pid)

    // Read progress file
    let progress: UpgradeProgress | undefined
    try {
      const progressJson = readFileSync(progressPath, 'utf-8')
      progress = JSON.parse(progressJson)
    } catch {
      // no progress yet
    }

    if (!alive) {
      // Process is dead but pid file exists → interrupted
      return {
        ...state,
        progress: {
          status: 'interrupted',
          ...(progress !== undefined
            ? { currentPackage: progress.currentPackage, percentage: progress.percentage }
            : {}),
        },
      }
    }

    return {
      ...state,
      progress,
    }
  }

  /**
   * Clean up stale operation state (dead pid file).
   * Called on plugin load for crash recovery.
   */
  async cleanupStaleOperation(): Promise<OperationState | undefined> {
    const status = this.getOperationStatus()
    if (status === null) {
      return undefined
    }

    if (status.progress?.status === 'interrupted') {
      // Clean up stale files
      await this.#cleanupStateFiles()
      return status
    }

    return undefined
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Core method: spawn apt-get with progress tracking via Status-Fd.
   */
  async #runAptGet(
    args: string[],
    operation: OperationState['operation'],
    packages?: string[]
  ): Promise<UpgradeResult> {
    // Concurrency guard
    const existing = this.getOperationStatus()
    if (existing !== null && existing.progress?.status !== 'interrupted') {
      throw new Error(
        `Another package operation is already in progress (pid ${existing.pid}, operation: ${existing.operation})`
      )
    }

    // Ensure state dir exists
    await mkdir(this.#stateDir, { recursive: true })

    const timestamp = Date.now()
    const logFile = join(this.#stateDir, `upgrade-${timestamp}.log`)
    const logStream = createWriteStream(logFile, { flags: 'a' })

    const child = spawn(APT_GET_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
      env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive', LC_ALL: 'C' },
    })

    const pid = child.pid
    if (pid === undefined) {
      logStream.destroy()
      throw new Error('Failed to spawn apt-get process')
    }

    // Write operation state atomically
    const operationState: OperationState = {
      pid,
      startedAt: timestamp,
      operation,
      ...(packages !== undefined ? { packages } : {}),
    }
    await this.#writeStateFile(OPERATION_FILE, operationState)

    // Track upgraded packages from stdout
    const packagesUpgraded: string[] = []
    let stdoutBuf = ''
    let stderrBuf = ''

    // Pipe stdout/stderr to log file and capture
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

    // Read progress from fd 3 (Status-Fd)
    const statusFd = child.stdio[3]
    let statusBuf = ''
    if (statusFd !== undefined && statusFd !== null && 'on' in statusFd) {
      ;(statusFd as NodeJS.ReadableStream).on('data', (data: Buffer) => {
        statusBuf += data.toString()
        const lines = statusBuf.split('\n')
        // Keep the last incomplete line in the buffer
        statusBuf = lines.pop()!
        for (const line of lines) {
          const progress = parseStatusFdLine(line)
          if (progress !== undefined) {
            // Write progress to file (fire and forget)
            this.#writeStateFile(PROGRESS_FILE, progress).catch(() => {})
          }
        }
      })
    }

    // Wait for the child process to exit
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on('error', reject)
      child.on('close', resolve)
    })

    logStream.end()

    // Parse upgraded packages from stdout
    // apt-get outputs lines like "Unpacking libfoo (1.2.3) over (1.2.2) ..."
    // or "Setting up libfoo (1.2.3) ..."
    for (const line of stdoutBuf.split('\n')) {
      const setupMatch = line.match(/^Setting up (\S+)\s/)
      if (setupMatch !== null) {
        packagesUpgraded.push(setupMatch[1]!)
      }
    }

    // Clean up state files
    await this.#cleanupStateFiles()

    if (exitCode !== 0) {
      log.error('apt-get failed', { exitCode, stderr: stderrBuf.slice(0, 500) })

      // Check for lock contention
      if (stderrBuf.includes('Could not get lock') || stderrBuf.includes('Unable to acquire')) {
        throw new Error('Another package operation is in progress (apt lock held by another process)')
      }

      const error = new Error(`apt-get ${args[0]} failed with exit code ${exitCode}`)
      ;(error as any).stderr = stderrBuf
      ;(error as any).logFile = logFile
      throw error
    }

    const requiredAction = await detectRequiredAction(packagesUpgraded)

    log.info('Upgrade completed', {
      operation,
      packagesUpgraded: packagesUpgraded.length,
      requiredAction,
    })

    return {
      success: true,
      packagesUpgraded,
      requiredAction,
      logFile,
    }
  }

  /**
   * Write a JSON state file atomically (write to tmp, then rename).
   */
  async #writeStateFile(filename: string, data: unknown): Promise<void> {
    const targetPath = join(this.#stateDir, filename)
    const tmpPath = `${targetPath}.tmp`
    await writeFile(tmpPath, JSON.stringify(data), 'utf-8')
    await rename(tmpPath, targetPath)
  }

  /**
   * Remove operation and progress state files.
   */
  async #cleanupStateFiles(): Promise<void> {
    const operationPath = join(this.#stateDir, OPERATION_FILE)
    const progressPath = join(this.#stateDir, PROGRESS_FILE)
    await rm(operationPath, { force: true })
    await rm(progressPath, { force: true })
  }
}
