# xo-server-package-manager — Implementation Plan

## Overview

XO Server plugin that wraps the local `apt` package manager on the XO appliance.
Exposes API methods: `packageManager.listUpgradable`, `packageManager.upgrade`, `packageManager.systemUpgrade`, `packageManager.getOperationStatus`.
Tracks long-running operations via apt's `APT::Status-Fd` protocol, with pid file for crash recovery.

Follows the standard xo-server plugin contract: factory default export, `configurationSchema`, lifecycle methods (`configure`, `load`, `unload`).

---

## Part 1 — Types and apt output parsing (no I/O)

**Goal:** Define all types and write pure parsing functions that can be fully unit-tested without root or apt.

### Files

- `src/types.mts` — All shared types
- `src/parse.mts` — Pure parsing functions
- `src/parse.test.mts` — Unit tests

### Types to define

`UpgradablePackage` lives in `@vates/types` (shared with front-end).
Field names align with `XcpPatches` where semantics overlap, enabling front-end component reuse.

```typescript
// --- In @vates/types — shared with front-end ---

interface UpgradablePackage {
  name: string // same as XcpPatches.name
  version: string // new available version — same as XcpPatches.version
  description: string // apt-cache show → Description — same as XcpPatches.description
  release: string // e.g., "bookworm", "bookworm-security" — same as XcpPatches.release
  size: number // download size in bytes — same as XcpPatches.size
  installedVersion: string // currently installed version (apt-specific)
  sourceRepository: string // e.g., "http://deb.debian.org/debian" (apt-specific)
}

// --- In plugin package — not shared ---

// Plugin configuration (empty for now, prepared for future options)
interface PackageManagerConfiguration {
  // placeholder — future options like:
  // refreshIntervalHours?: number
  // allowedRepositories?: string[]
}

type RequiredAction = 'none' | 'restartServices' | 'restartXoServer' | 'restartSystem'

interface UpgradeProgress {
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  currentPackage?: string
  currentIndex?: number
  totalPackages?: number
  percentage?: number
}

interface UpgradeResult {
  success: boolean
  packagesUpgraded: string[]
  requiredAction: RequiredAction
  logFile: string
}

interface OperationState {
  pid: number
  startedAt: number // Date.now() timestamp
  operation: 'upgrade' | 'systemUpgrade'
  packages?: string[] // only for targeted upgrade
}
```

### Parsing functions

- `parseUpgradableList(stdout: string): Partial<UpgradablePackage>[]`
  - Input: raw output of `apt list --upgradable`
  - Format: `package/source version1 arch [upgradable from: version2]`
  - Extracts: `name`, `version`, `installedVersion`, `release`
  - Tests: empty list, single package, multiple packages, multiple sources (e.g., `bookworm,bookworm-security`), malformed lines (skip gracefully)

- `parseAptCacheShow(stdout: string): Map<string, { description: string; size: number; sourceRepository: string }>`
  - Input: raw output of `apt-cache show pkg1 pkg2 ...`
  - Extracts: `Description`, `Size`, source repo from `APT-Sources` or `Filename` field
  - Tests: single package, multiple packages, missing fields (fallback to empty/0)

- `parseStatusFdLine(line: string): UpgradeProgress | undefined`
  - Input: one line from apt's `Status-Fd` stream
  - Format: `pmstatus:package:percentage:message`
  - Tests: valid status line, non-pmstatus line (ignored), edge cases (100%, 0%)

- `detectRequiredAction(packagesUpgraded: string[]): Promise<RequiredAction>`
  - Check `/var/run/reboot-required` → `restartSystem`
  - Check if `xo-server` or `node` in upgraded list → `restartXoServer`
  - Check `needrestart -b` if available → `restartServices`
  - Otherwise → `none`
  - Tests: mock file existence checks, various package lists

### Data flow for `listUpgradable()`

Two commands needed to fill all fields:

1. `apt list --upgradable` → name, version, installedVersion, release
2. `apt-cache show pkg1 pkg2 ...` → description, size, sourceRepository

Merged by package name into full `UpgradablePackage[]`.

### Done when

- [x] `yarn build` compiles cleanly
- [x] `yarn test` passes all 21 parsing unit tests
- [x] No I/O, no root needed, runs anywhere

### Status: COMPLETE

---

## Part 2 — Apt backend (command execution)

**Goal:** Implement the actual apt commands using `spawn`/`execFile`, pid file management, and progress tracking.

### Files

- `src/apt.mts` — `AptPackageManager` class

### Class: `AptPackageManager`

```typescript
class AptPackageManager {
  constructor(stateDir: string) // e.g., /var/lib/xo-server-package-manager/

  checkAptAvailable(): void // throws if /usr/bin/apt-get missing

  listUpgradable(): Promise<UpgradablePackage[]>
  // runs: apt list --upgradable
  // parses with parseUpgradableList()

  upgrade(packages?: string[]): Promise<UpgradeResult>
  // runs: apt-get upgrade -y -o APT::Status-Fd=3 [packages...]
  // writes pid file, streams progress to progress file, captures raw log
  // on completion: detects required action, cleans up pid file

  systemUpgrade(): Promise<UpgradeResult>
  // runs: apt-get dist-upgrade -y -o APT::Status-Fd=3
  // same tracking as upgrade()

  getOperationStatus(): (OperationState & { progress?: UpgradeProgress }) | null
  // reads pid file + progress file
  // if pid alive: return current state with latest progress
  // if pid dead + pid file exists: return interrupted
  // if no pid file: return null (idle)
}
```

### Pid file management

- Location: `{stateDir}/operation.json` — contains `OperationState`
- Written atomically (write to tmp, rename)
- Deleted on successful completion
- On startup: if exists and pid dead → mark as interrupted

### Progress file

- Location: `{stateDir}/progress` — last parsed `UpgradeProgress` as JSON
- Overwritten on each `pmstatus` line from apt
- Read by `getOperationStatus()`

### Raw log

- Location: `{stateDir}/upgrade-{timestamp}.log`
- stdout + stderr of apt-get, appended in real-time

### Concurrency guard

- Before starting any operation: check pid file. If operation running, throw.

### Done when

- [x] `yarn build` compiles cleanly
- [ ] Can run `listUpgradable()` on a real Debian system and get structured output
- [ ] Can run `upgrade()` on a real system with progress events written to file
- [ ] Pid file correctly created and cleaned up
- [ ] Integration test: hold back a package, upgrade it, verify result

### Status: CODE COMPLETE — awaiting integration testing on Debian VM

---

## Part 3 — Plugin integration (xo-server wiring)

**Goal:** Wire `AptPackageManager` as an xo-server plugin following the standard plugin contract.

### Files

- `src/index.mts` — Plugin entry point

### Plugin contract

The plugin must export:

- `configurationSchema` — JSON Schema for plugin config (empty object for now)
- `default` — factory function receiving `{ xo, getDataDir }`
- Instance with lifecycle: `configure()`, `load()`, `unload()`
- API methods registered via `xo.addApiMethods()` (returns unregister function)

### Plugin structure

```typescript
import { createLogger } from '@xen-orchestra/log'
import { AptPackageManager } from './apt.mjs'
import type { PackageManagerConfiguration } from './types.mjs'

const logger = createLogger('xo:xo-server-package-manager')

// --- Configuration schema (empty for now, prepared for future options) ---
export const configurationSchema = {
  type: 'object' as const,
  properties: {
    // future: refreshIntervalHours, allowedRepositories, etc.
  },
  additionalProperties: false,
}

// --- Plugin class ---
class PackageManagerPlugin {
  readonly #xo: any
  readonly #getDataDir: () => Promise<string>
  #apt: AptPackageManager | undefined
  #configuration: PackageManagerConfiguration | undefined
  #unregisterApiMethods: (() => void) | undefined

  constructor({ xo, getDataDir }: { xo: any; getDataDir: () => Promise<string> }) {
    this.#xo = xo
    this.#getDataDir = getDataDir
  }

  configure(configuration: PackageManagerConfiguration) {
    this.#configuration = configuration
  }

  async load() {
    const dataDir = await this.#getDataDir()
    const apt = new AptPackageManager(dataDir)
    apt.checkAptAvailable()
    this.#apt = apt

    // recover interrupted operations
    const status = apt.getOperationStatus()
    if (status !== null && status.progress?.status === 'interrupted') {
      logger.warn('Detected interrupted package operation', { operation: status.operation })
    }

    // register API methods
    const listUpgradable = () => apt.listUpgradable()
    listUpgradable.permission = 'admin'
    listUpgradable.description = 'List upgradable system packages'

    const upgrade = ({ packages }: { packages?: string[] }) => apt.upgrade(packages)
    upgrade.permission = 'admin'
    upgrade.description = 'Upgrade system packages'
    upgrade.params = {
      packages: { type: 'array', items: { type: 'string' }, optional: true },
    }

    const systemUpgrade = () => apt.systemUpgrade()
    systemUpgrade.permission = 'admin'
    systemUpgrade.description = 'Perform a full distribution upgrade'

    const getOperationStatus = () => apt.getOperationStatus()
    getOperationStatus.permission = 'admin'
    getOperationStatus.description = 'Get status of running package operation'

    this.#unregisterApiMethods = this.#xo.addApiMethods({
      packageManager: {
        listUpgradable,
        upgrade,
        systemUpgrade,
        getOperationStatus,
      },
    })
  }

  async unload() {
    this.#unregisterApiMethods?.()
    this.#unregisterApiMethods = undefined
    this.#apt = undefined
  }
}

// --- Factory (default export) ---
export default function packageManagerPluginFactory(opts: { xo: any; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
```

### Done when

- Plugin loads in xo-server without error
- `configure()` / `load()` / `unload()` lifecycle works
- API methods callable and admin-only
- `getDataDir()` used for state directory (standard plugin pattern)

---

## Part 4 — Crash recovery and robustness

**Goal:** Handle edge cases: interrupted upgrades, stale pid files, concurrent calls.

### Scenarios to handle

1. **xo-server restarts during upgrade**
   - On `load()`: check pid file. If pid dead → log warning, clean up pid file.
   - `listUpgradable()` shows remaining packages (apt's own state is the truth).

2. **VM reboots during dist-upgrade**
   - Same as above. dpkg may be in a broken state.
   - `getOperationStatus()` returns `interrupted`.
   - User should run `dpkg --configure -a` — consider exposing a `repair()` method.

3. **apt lock contention**
   - Another process holds `/var/lib/dpkg/lock`.
   - Detect and throw a clear error ("another package operation is in progress").

4. **Network failure during apt-get update**
   - apt-get returns non-zero. Capture stderr, throw with context.

### Testing

- Integration tests with simulated failures (kill spawned process, check recovery)
- Unit tests for pid file state machine (alive, dead, stale, missing)

### Done when

- Interrupted operations are detected and reported cleanly
- No zombie pid files after crash
- Concurrent call attempts are rejected with a clear error

---

## Part 5 — Progress monitoring API

**Goal:** Let consumers poll for real-time progress of running operations.

### API method

- `packageManager.getOperationStatus` — already wired in Part 3
- This part focuses on end-to-end validation and edge cases

### Behavior

- While upgrade runs: returns `{ status: 'running', currentPackage, currentIndex, totalPackages, percentage }`
- After completion: returns `null` (idle)
- After crash/interruption: returns `{ status: 'interrupted', operation, startedAt }`

### Done when

- While an upgrade runs, polling `getOperationStatus` returns increasing progress
- After completion, returns `null`
- After crash, returns `{ status: 'interrupted' }`

---

## Implementation order

```
Part 1 → Part 2 → Part 3 → Part 4 → Part 5
 types     apt      plugin   recovery  progress
 parsing   I/O      wiring   edge      e2e
 (pure)    (root)   (xo)     cases     validation
```

Each part is independently testable. Parts 1-2 can be developed without xo-server running.

## Test environment

A Debian VM is available for integration tests via `ssh debian@<ip>` (`debian` is a sudoer).

- Part 1 unit tests: run locally, no VM needed
- Part 2+ integration tests: run commands on the VM via SSH to validate real apt output parsing and upgrade flows
- The integration test harness should accept the VM IP as an env var (e.g., `TEST_VM_IP`)
