import type { DistributionUpgrade, DistributionUpgradeRun } from '@vates/types'
import { execFile } from 'node:child_process'
import { readFile, rm, statfs, writeFile } from 'node:fs/promises'
import { release } from 'node:os'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { incorrectState } from 'xo-common/api-errors.js'
import { isRebootRequired } from './apt.mjs'
import { readInstalledRelease } from './distribution.mjs'
import { parseStatusFdLine } from './parse.mjs'

const execFileAsync = promisify(execFile)

// shipped at the root of the package, next to `dist/`
const SCRIPT_PATH = fileURLToPath(new URL('../dist-upgrade.sh', import.meta.url))

// the upgrade runs in its own unit: it restarts xo-server, which would kill it as part of its cgroup
const UNIT_NAME = 'xo-dist-upgrade'

// downloaded packages and unpacked files, a full disk in the middle of the upgrade leaves a broken system
const APT_CACHE_PATH = '/var/cache/apt/archives'
const MIN_FREE_SPACE = 2 * 1024 ** 3

const POLL_INTERVAL = 2e3

// steps after which the script restarts xo-server, see `dist-upgrade.sh`
const STEPS_WITH_RESTART = ['upgrade-next-release', 'full-upgrade-next-release', 'done']

async function isUnitActive(): Promise<boolean> {
  try {
    await execFileAsync('systemctl', ['is-active', '--quiet', UNIT_NAME])
    return true
  } catch (error) {
    // exit code 3: inactive unit, 4: unknown unit (e.g. removed by `--collect`)
    const { code } = error as { code?: unknown }
    if (code === 3 || code === 4) {
      return false
    }
    // e.g. systemctl cannot start while the upgrade replaces libcrypto
    throw error
  }
}

/**
 * The systemd service running xo-server, restarted by the script at the end of the upgrade, undefined outside a service
 */
async function getXoServerUnit(): Promise<string | undefined> {
  // cgroup v2: `0::/system.slice/xo-server.service`
  const match = (await readFile('/proc/self/cgroup', 'utf8')).match(/\/([^/\n]+\.service)$/m)
  return match?.[1]
}

async function execOutput(cmd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, { env: { ...process.env, LC_ALL: 'C' } })
  return stdout.trim()
}

async function checkPreconditions(): Promise<void> {
  if (await isUnitActive()) {
    incorrectState({ object: UNIT_NAME, property: 'active', actual: true, expected: false })
  }

  // a half-configured package would fail the upgrade
  const audit = await execOutput('dpkg', ['--audit'])
  if (audit !== '') {
    incorrectState({ object: 'dpkg', property: 'audit', actual: audit, expected: '' })
  }

  // held packages would not be upgraded to the next release
  const heldPackages = await execOutput('apt-mark', ['showhold'])
  if (heldPackages !== '') {
    incorrectState({ object: 'apt', property: 'heldPackages', actual: heldPackages.split('\n'), expected: [] })
  }

  const { bavail, bsize } = await statfs(APT_CACHE_PATH)
  const freeSpace = bavail * bsize
  if (freeSpace < MIN_FREE_SPACE) {
    incorrectState({ object: APT_CACHE_PATH, property: 'freeSpace', actual: freeSpace, expected: MIN_FREE_SPACE })
  }
}

/**
 * Start the upgrade to the next release in a transient systemd unit and return without waiting for it
 */
export async function startDistributionUpgrade({
  distributionUpgrade: { from, to },
  stateFile,
}: {
  readonly distributionUpgrade: DistributionUpgrade
  readonly stateFile: string
}): Promise<DistributionUpgradeRun> {
  await checkPreconditions()

  // until the script writes its own, e.g. if it fails to start
  const run: DistributionUpgradeRun = { status: 'running', step: 'starting', from, to, startedAt: Date.now() }
  await writeFile(stateFile, JSON.stringify(run))
  await rm(`${stateFile}.ack`, { force: true })

  const xoServerUnit = await getXoServerUnit()
  await execFileAsync('systemd-run', [
    `--unit=${UNIT_NAME}`,
    // removes the unit even if it failed, so that the next upgrade can reuse its name
    '--collect',
    '--description=Upgrade the XO appliance to the next Debian release',
    SCRIPT_PATH,
    String(from.versionId),
    from.codename,
    String(to.versionId),
    to.codename,
    stateFile,
    ...(xoServerUnit === undefined ? [] : [xoServerUnit]),
  ])
  return run
}

async function readFileIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

/**
 * Last percentage written by apt to the status-fd file of the script
 */
async function readProgress(stateFile: string): Promise<number | undefined> {
  const lines = ((await readFileIfExists(`${stateFile}.status-fd`)) ?? '').split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const percentage = parseStatusFdLine(lines[i]!)
    if (percentage !== undefined) {
      return percentage
    }
  }
  return undefined
}

export async function readLastDistributionUpgrade(stateFile: string): Promise<DistributionUpgradeRun | undefined> {
  const content = await readFileIfExists(stateFile)
  if (content === undefined) {
    return undefined
  }

  const run: DistributionUpgradeRun = JSON.parse(content)
  if (run.status !== 'running') {
    return run
  }
  let isRunning: boolean
  try {
    isRunning = await isUnitActive()
  } catch {
    // systemctl may fail for a few seconds while the upgrade replaces its libraries: the state file is still right
    isRunning = true
  }
  if (!isRunning) {
    return { ...run, status: 'interrupted' }
  }
  return { ...run, progress: await readProgress(stateFile) }
}

/**
 * Poll the state of the upgrade until it is no longer running
 */
export async function waitForDistributionUpgradeEnd({
  stateFile,
  onRunning,
}: {
  readonly stateFile: string
  readonly onRunning: (run: DistributionUpgradeRun) => void
}): Promise<DistributionUpgradeRun> {
  while (true) {
    const run = await readLastDistributionUpgrade(stateFile)
    if (run === undefined) {
      throw new Error(`${stateFile} has been removed during the distribution upgrade`)
    }
    if (run.status !== 'running') {
      return run
    }
    onRunning(run)
    await setTimeout(POLL_INTERVAL)
  }
}

/**
 * Let the script restart xo-server, once the end of the upgrade has been recorded
 */
export async function acknowledgeDistributionUpgradeEnd(stateFile: string): Promise<void> {
  await writeFile(`${stateFile}.ack`, '')
}

/**
 * The last upgrade if it has not been checked since xo-server was restarted by it
 */
export async function getDistributionUpgradeToCheck(stateFile: string): Promise<DistributionUpgradeRun | undefined> {
  const run = await readLastDistributionUpgrade(stateFile)
  if (
    run === undefined ||
    run.status === 'running' ||
    run.checkedAt !== undefined ||
    // the upgrade failed before installing anything, the system has not changed
    !STEPS_WITH_RESTART.includes(run.step)
  ) {
    return undefined
  }
  return run
}

export async function markDistributionUpgradeChecked({
  run,
  stateFile,
}: {
  readonly run: DistributionUpgradeRun
  readonly stateFile: string
}): Promise<void> {
  await writeFile(stateFile, JSON.stringify({ ...run, checkedAt: Date.now() }))
}

/**
 * Check the system after the upgrade, the result is also meant for the support
 */
export async function checkDistributionUpgrade(run: DistributionUpgradeRun) {
  const installedRelease = await readInstalledRelease()
  const dpkgAudit = await execOutput('dpkg', ['--audit'])
  const result = {
    upgrade: run,
    installedRelease,
    kernel: release(),
    nodeVersion: process.version,
    isRebootRequired: await isRebootRequired(),
  }

  const problems: string[] = []
  if (run.status !== 'success') {
    problems.push(`the upgrade ended with ${run.status} at step ${run.step}`)
  }
  if (installedRelease?.versionId !== run.to.versionId) {
    problems.push(`Debian ${run.to.versionId} expected, ${installedRelease?.versionId ?? 'unknown'} installed`)
  }
  if (dpkgAudit !== '') {
    problems.push(`dpkg --audit: ${dpkgAudit}`)
  }
  if (problems.length !== 0) {
    throw Object.assign(new Error(problems.join(', ')), result)
  }
  return result
}
