<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/qa-test

> XenOrchestra QA Test Suite

## Usage

# @xen-orchestra/qa-test

End-to-end QA test suite for Xen Orchestra. Tests core features (VM, backup, export) against a real XO instance.

## Prerequisites

- Node.js >= 24 (required for `await using` and `--env-file-if-exists`)
- A running Xen Orchestra instance (REST API + WebSocket)
- A reference VM to clone for tests
- An available Storage Repository
- ~20 GB of disk space on the XO server for backups

## Installation

From the monorepo root:

```bash
yarn install
```

## Configuration

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

### Variables

All variables are required. The test suite fails immediately if any are missing.

| Variable                 | Description                                                                                                                                                                                | Example                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `HOSTNAME`               | XO instance URL                                                                                                                                                                            | `http://10.1.4.216:9000`      |
| `USERNAME`               | XO user                                                                                                                                                                                    | `admin@admin.net`             |
| `PASSWORD`               | XO password                                                                                                                                                                                | `admin`                       |
| `REFERENCE_VM_ID`        | UUID of the VM to clone for tests                                                                                                                                                          | `61c24db9-262d-...`           |
| `SR_ID`                  | UUID of the Storage Repository                                                                                                                                                             | `8aa2fb4a-143e-...`           |
| `VM_PREFIX`              | Test VM name prefix                                                                                                                                                                        | `TST`                         |
| `BACKUP_REPOSITORY_NAME` | Backup repository name in XO                                                                                                                                                               | `Test backup QA`              |
| `BACKUP_REPOSITORY_URL`  | `@xen-orchestra/fs` URL for the test backup remote. For `file://` remotes the path must contain `test`, `qa`, or `tmp/xo`. Any supported backend works (`s3://`, `nfs://`, `azure://`, …). | `file:///tmp/xo-test-backups` |
| `VHD_EXPORT_PATH`        | VHD/XVA export directory (must contain `test`, `qa`, or `tmp/`)                                                                                                                            | `/tmp/xo-test-exports`        |

The following are required only for mirror backup tests (`qa:mirror`):

| Variable                             | Description                                                                                              | Example                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `MIRROR_DESTINATION_REPOSITORY_NAME` | Mirror destination repository name                                                                       | `Test mirror QA`             |
| `MIRROR_DESTINATION_REPOSITORY_URL`  | `@xen-orchestra/fs` URL for the mirror destination. Same backend flexibility as `BACKUP_REPOSITORY_URL`. | `file:///tmp/xo-test-mirror` |

The following are optional, for load tests (disk churn via SSH). Leave `TEST_VM_SSH_KEY` unset
to let `ssh` fall back to its own default identity files / `ssh-agent`:

| Variable           | Description                                                                                                 | Example         |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------------- |
| `TEST_VM_SSH_USER` | SSH user on the load-test VMs (default `root`)                                                              | `root`          |
| `TEST_VM_SSH_KEY`  | Path to the private key matching a public key already authorized on `REFERENCE_VM_ID` (e.g. via cloud-init) | `~/.ssh/qa_key` |

> **Safety**: for `file://` remotes the path component of the URL must contain `test`, `qa`, or `tmp/xo` to prevent accidental deletion of production data. Non-local remotes (`s3://`, `nfs://`, …) skip this local-path check — cleanup is delegated to the XO API.

## Logging

Console output defaults to `info` level. Two env variables control verbosity:

| Variable      | Description                               | Example            |
| ------------- | ----------------------------------------- | ------------------ |
| `DEBUG`       | Enable debug logs for matching namespaces | `DEBUG='qa:*'`     |
| `DEBUG_LEVEL` | Override the default console log level    | `DEBUG_LEVEL=warn` |

All debug-level logs are also written to a temp file at startup regardless of `DEBUG`. The path is printed to stderr:

```
[qa-test] debug log: /tmp/xo-qa-test-1715000000000.log
```

Log namespaces follow the pattern `qa:<suite>[:<variant>]`:

| Namespace              | Test file                                   |
| ---------------------- | ------------------------------------------- |
| `qa:infrastructure`    | `tests/infrastructure.test.js`              |
| `qa:backup:base`       | `tests/backup.test.js`                      |
| `qa:backup:nbd`        | `tests/backup.nbd.test.js`                  |
| `qa:backup:combined`   | `tests/backup-replication-combined.test.js` |
| `qa:mirror`            | `tests/backup-mirror.test.js`               |
| `qa:export`            | `tests/export.vhd.test.js`                  |
| `qa:load:backup:delta` | `scripts/backup-load-delta.mjs`             |

## Running tests

All tests (sequential):

```bash
yarn workspace @xen-orchestra/qa-test qa
```

### Individual test suites

```bash
yarn workspace @xen-orchestra/qa-test qa:infrastructure   # Connectivity and configuration
yarn workspace @xen-orchestra/qa-test qa:vm                # VM lifecycle (clone, start, stop, delete)
yarn workspace @xen-orchestra/qa-test qa:backup            # Full and delta backup
yarn workspace @xen-orchestra/qa-test qa:backup:nbd        # Backup with NBD protocol
yarn workspace @xen-orchestra/qa-test qa:backup:combined   # Advanced scenarios (replication + backup)
yarn workspace @xen-orchestra/qa-test qa:export            # VHD/XVA export and restoration
```

### Test subsets

```bash
yarn workspace @xen-orchestra/qa-test qa:backup:combined:cycle  # Full Cycle only
yarn workspace @xen-orchestra/qa-test qa:export:vhd             # VDI VHD export only
yarn workspace @xen-orchestra/qa-test qa:export:xva             # XVA export only
yarn workspace @xen-orchestra/qa-test qa:export:restore         # Restoration only
```

### Load tests

Unlike the suites above, load tests are standalone scripts (not `node --test` files): they clone a
fleet of VMs from `REFERENCE_VM_ID`, churn their disks over SSH between runs, and repeatedly execute
one backup job spanning the whole fleet — measuring total job duration (export + merge/cleanup) per
run to help answer questions like "what's the optimal concurrency/retention for my setup?".

```bash
yarn workspace @xen-orchestra/qa-test qa:load:backup:delta -- \
  --vms 16 --concurrency 4 --churn-percent 5 --runs 10 --retention 3
```

| Flag              | Default                        | Description                                                                                                                                                              |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--vms`           | `4`                            | Number of VMs cloned from `REFERENCE_VM_ID` into the fleet                                                                                                               |
| `--concurrency`   | `2`                            | Job's `concurrency` setting — how many VMs export in parallel; also bounds fleet clone/boot and per-run churn parallelism                                                |
| `--churn-percent` | `5`                            | % of each VM's primary disk overwritten with fresh data before every run                                                                                                 |
| `--runs`          | `5`                            | Number of backup runs                                                                                                                                                    |
| `--retention`     | `2`                            | Job's `exportRetention` — restore points kept before a merge is triggered. Set `< runs` or no merge ever fires                                                           |
| `--repositories`  | `BACKUP_REPOSITORY_NAME`       | Comma-separated backup repository name(s) to write to. The default name is auto-created from `BACKUP_REPOSITORY_URL` if missing; any other name must already exist in XO |
| `--output-dir`    | `load-test-results/<jobName>/` | Where per-run JSON logs and `summary.json` are written                                                                                                                   |
| `--keep`          | off                            | Skip all cleanup — fleet, job, schedule and backups are left in place                                                                                                    |
| `--keep-backups`  | off                            | Delete only the fleet VMs; leave the job, schedule and backup data in place (e.g. to inspect a dedup backend's on-disk state afterward)                                  |

Requires `SR_ID` (used to restore the latest backup of one fleet VM at the end of the run, validating
the chain is actually restorable) and optionally `TEST_VM_SSH_USER`/`TEST_VM_SSH_KEY` (see above).

Each run's full backup log is written to `<output-dir>/run-<n>.json`; `summary.json` has per-run
timing/throughput plus fleet-wide totals — feed either back for analysis the same way as any other
backup log dump.

### Demo (quick connectivity check)

```bash
yarn workspace @xen-orchestra/qa-test demo
```

## Architecture

```
@xen-orchestra/qa-test/
├── index.js                  # Entry point (connectivity demo)
├── backup.config.js          # Backup job configuration generator
├── client/
│   ├── dispatchClient.js     # Central hub: orchestrates connections and handlers
│   ├── restApiClient.js      # HTTP REST API client (reads)
│   ├── xoLibClient.js        # WebSocket connection via xo-lib (writes)
│   ├── cleanupClient.js      # Automatic test resource cleanup
│   ├── FilterBuilder.js      # REST API filter builder
│   └── requests/             # Specialized handlers per resource
│       ├── abstract.js       #   Base class (generic CRUD)
│       ├── vm.js             #   VMs (clone, start, stop, export)
│       ├── backup.js         #   Backup jobs
│       ├── backupLog.js      #   Backup logs
│       ├── misc.js           #   Backup repositories
│       ├── sr.js             #   Storage Repositories
│       └── vdi.js            #   Virtual Disk Images
├── tests/
│   ├── setup.js              # Shared setup/teardown (clone VM, create repository)
│   ├── infrastructure.test.js
│   ├── vm.test.js
│   ├── backup.test.js
│   ├── backup.nbd.test.js
│   ├── backup-replication-combined.test.js
│   └── export.vhd.test.js
├── utils/
│   ├── index.js              # Assertions and utilities (waitUntil, scheduling)
│   ├── backupUtils.js        # Backup validation utilities
│   ├── exportUtils.js        # VHD/XVA integrity validation
│   ├── resourceTracker.js    # Resource tracking for automatic cleanup
│   ├── vmChurn.js            # SSH-based disk churn for load tests
│   └── fleetUtils.js         # Clone/boot a fleet of VMs for load tests
└── scripts/
    ├── test-backup-and-purge.js   # Standalone script: backup + purge E2E
    ├── test-purge-backups.js      # Standalone script: purge diagnostics
    └── backup-load-delta.mjs      # Load test: delta backup on a cloned VM fleet
```

### Dispatch pattern

The `DispatchClient` is the main entry point. It orchestrates:

- **REST API** (`restApiClient`) for reads (GET)
- **WebSocket** (`xoLibClient` via `xo-lib`) for writes (JSON-RPC calls)

Each handler in `requests/` extends `AbstractRequest` which provides generic CRUD operations with a REST-first approach.

### Test lifecycle

1. **Setup** (`tests/setup.js`): connect to XO, clone reference VM, create backup repository
2. **Run**: each `*.test.js` file uses `setup()` and `teardown()`
3. **Teardown**: automatic deletion of all tracked resources (VMs, jobs, schedules)

The `ResourceTracker` ensures no test resource is left orphaned after execution.

## ESLint

The local `.eslintrc.cjs` configures:

- `@babel/eslint-parser` to support `await using` syntax (Explicit Resource Management)
- `sourceType: 'module'` (root ESLint defaults to `sourceType: 'script'`)

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
