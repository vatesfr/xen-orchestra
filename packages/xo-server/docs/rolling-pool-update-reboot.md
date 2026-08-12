## On-disk traces

Each RPU/RPR run writes two files in `<datadir>/rpu-traces` (`/var/lib/xo-server/data/rpu-traces` on XOA, `rpu.tracesDir` to override):

```
rpu-<poolId>-<ISO timestamp>.ndjson           # the trace
rpu-<poolId>-<ISO timestamp>.heartbeat.json   # the liveness file
```

The trace is a tee of the task tree below: every `start`, `property` and `end` event, serialized one JSON object per line, linked by `id`/`parentId`. Writes are synchronous, so nothing is lost on SIGKILL and the file is parsable line by line after any crash (a truncated last line is possible, skip it). The `end` event of a failed task carries the full serialized error, XAPI traceback included.

The heartbeat is rewritten every 5 seconds while the run is alive:

| Heartbeat content                                 | Meaning                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `{"lastUpdated": <fresh>, "status": "pending"}`   | run in progress                                                               |
| `{"lastUpdated": <stale>, "status": "pending"}`   | run died mid-flight, xo-server not restarted yet                              |
| `{"status": "interrupted", "lastAlive": ...}`     | xo-server restarted and reconciled; `lastAlive` = last heartbeat before death |
| `{"status": "success"}` / `{"status": "failure"}` | run finished, file frozen                                                     |

Old traces are garbage-collected on mtime (`rpu.tracesRetention`, 31 days by default), at startup and every 6 hours. Traces of running operations are never collected.

### Diagnosing a run (support)

1. Find the trace. Its path is logged at start and at reconciliation:

   ```
   journalctl -u xo-server | grep 'trace in'
   ```

   It's also the `traceFile` property on the root task.

2. Check the heartbeat first. It answers "is it dead or just slow?" in one read. During `Installing patches` the task tree can stay silent for 20 minutes, that's normal as long as the heartbeat moves.

3. Read the trace itself. The last line is the last thing that happened before the crash:

   ```bash
   tail -1 <trace>.ndjson
   ```

   To list the steps in the order they were reached:

   ```bash
   grep '"type":"start"' <trace>.ndjson | grep -o '"name":"[^"]*"'
   ```

   A step that shows up here but has no matching `"type":"end"` line was still running when the run died. The interrupted task in the XO tasks view shows the same thing per subtask.

4. For a `failure`, the root `end` event has the error. `journalctl` is not reliable for this: the UI polls `listMissingPatches` during the run and produces the exact same `updater plugin is busy` stack traces as a real failure.

### Failure signatures seen in the field

| Error                                                                                 | What it is                                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `The updater plugin is busy (current operation: update)` on `Listing missing patches` | Race between the LINSTOR update step and `check_update`: the updater lock on the host is not released yet. Not destructive, happens before anything is installed. Relaunch. |
| `VM_LACKS_FEATURE` with OpaqueRefs, on `Updating and rebooting`                       | A running VM has no PV drivers. `assert_can_evacuate` runs on all hosts before anything starts, so the RPU refuses upfront. Shut the VM down or install guest tools.        |
| `MESSAGE_PARAMETER_COUNT_MISMATCH(host.evacuate, 1, 3)` (DEBUG)                       | Expected signature fallback on XAPI 8.2. WARN only if every supported signature fails.                                                                                      |
| Timeout on `Waiting for host to be up`                                                | Host takes too long to boot. `xapiOptions.restartHostTimeout` (default 20 minutes).                                                                                         |
| Pool stays `disconnected` after the master rebooted, `EHOSTUNREACH`                   | Stale connection error, the retry did not kick in yet. `POST /rest/v0/servers/<id>/actions/connect` reconnects immediately.                                                 |
| `TWINSTOR storage did not get back in sync in time`                                   | See TWINSTOR pacing below. The message carries what was holding the run back.                                                                                               |
| `unsupported TWINSTOR schema`                                                         | The pool runs a TWINSTOR version newer than this XO. Update XO. See TWINSTOR pacing below.                                                                                  |

Note on granularity: `Evacuate` is a single `host.evacuate` XAPI call, there is no per-VM detail in the tree for that phase. When `shutdownPinnedVms` is enabled and pinned VMs are present, per-VM subtasks also appear under `Shut down pinned VMs` and `Restart pinned VMs`.

## TWINSTOR pacing

On a pool whose SR is backed by TWINSTOR, the two hosts hold one replica each. While a replica is catching up, a single host holds the only up-to-date copy of the data, so rebooting the other one takes the storage down under the running VMs. Rebooting is itself what starts the next resync, so this is what paces the whole run.

The run holds three times: once before it disables anything, then before evacuating each host and again right before rebooting it, as a `Waiting for TWINSTOR storage to be in sync` task. Its `progress` is the resync percentage and its `twinstorState` property says what is holding it back. Pools without a TWINSTOR SR are unaffected.

A host is rebooted only once every one of these holds:

- every TWINSTOR SR has `twinstor-synced=true` and `twinstor-storage-state=synced`, both, not either. Only the pool master writes these, from its own DRBD status, which is the one that sees both replicas
- its `twinstor-updated-at` differs from the one accepted by the previous wait, which proves the pool master has published this verdict rather than left it behind when a host went down
- every TWINSTOR host's `twinstor-alive` differs likewise, which proves its daemon is running: DRBD keeps replicating in the kernel without it, so the pair reads as healthy while a node has no supervision at all

Both are heartbeats, rewritten every 60 seconds even when nothing changed (`ALIVE_STAMP_INTERVAL` in the daemon), so XO never reads their value and never has to decide how old a stamp is against its own clock. The cost is that each wait lasts until the next heartbeat, so up to about a minute on a healthy pool. A graceful daemon stop removes `twinstor-alive` outright, which blocks the gate at once rather than after a staleness delay.

`twinstor-schema` is the version of the key set, bumped when the meaning of the keys changes. An unrecognized value fails the run at once instead of after the timeout. Currently supported: `1`.

Detection is SR-based, not host-based: uninstalling TWINSTOR destroys the SR and its keys, but leaves `twinstor-version` on the hosts forever, so a host-based check would keep gating a pool which no longer uses TWINSTOR. `pool.other_config:twinstor_setup` is not used, it is cleared once the cluster is formed.

The first wait is placed before HA, `auto_poweron`, the load balancer and the pool's backup schedules are disabled: a pool whose storage is not redundant waits there with everything still enabled, and aborting it costs nothing.

### Aborting a run

Aborting (`POST /rest/v0/tasks/<id>/actions/abort`) while the run waits on the storage stops it at once, without rebooting the host it was waiting for. It is honored between two hosts too, so aborting during host 1's reboot means host 2 is never touched. It is not honored once a host is on its way down, there is no un-rebooting it. Cleanups then run as on any failure: HA and `auto_poweron` restored, shut-down pinned VMs started again, evacuated host re-enabled. VMs are left where they were evacuated to.

### Timeout

`xapiOptions.twinstorSyncTimeout` (default 2 hours) is the total a run may spend waiting on the storage, shared by every wait, so it also bounds how long the pool is held with HA disabled. Only waiting is charged to it, not evacuating, patching or rebooting. The storage is polled every 10 seconds throughout. On expiry the run fails rather than proceeding.

Note that HA is off for the whole run, so TWINSTOR raises its own `twinstor_ha_disarmed` alert after 30 minutes. During a gated run that is expected.

| `twinstorState` says                                                | What it is                                                                                                                                                                                          |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SR> is syncing`                                                   | A resync genuinely longer than the budget, e.g. a full sync after a disk replacement (~90 min for 500 GB on 1 GbE, proportionally longer on a larger SR). Raise `twinstorSyncTimeout` and relaunch. |
| `<SR> is stalled`                                                   | The replication link is saturated or broken. Check it on the hosts with `twinstor status` before relaunching.                                                                                       |
| `<SR> is degraded`                                                  | The peer's disk is failed or detached, the storage has no redundant copy. Fix the storage first, the pool must not be rebooted in this state.                                                       |
| `<SR> is not-ready`                                                 | No up-to-date replica is available at all. Fix the storage first, the pool must not be rebooted in this state.                                                                                      |
| `<SR> is in an unknown state`                                       | The SR advertises no `twinstor-storage-state` at all, usually a daemon which never came up on the pool master.                                                                                      |
| `TWINSTOR has not published its state since the last host rebooted` | The pool master has not published since the previous reboot. Normally clears within a minute of its daemon coming back.                                                                             |
| `the TWINSTOR daemon is not running on <host>`                      | That host stopped stamping `twinstor-alive`. DRBD keeps replicating without the daemon, but the node has no supervision, fencing or recovery. Start it.                                             |
| `the TWINSTOR state of the pool could not be read`                  | XAPI did not answer. Usually transient while the master reconnects after its own reboot, the run keeps retrying.                                                                                    |

## Task logs

Rolling pool update and rolling pool reboot task logs have major parts in common.

### Rolling pool reboot

```
task.start({ name: 'Rolling pool reboot', poolId: string, poolName: string })
├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync', progress: number, twinstorState: string })
│  └─ task.end
├─ task.start({ name: 'Restarting hosts', total: number, progress: number, done: number })
|  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
|  |  ├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync before evacuating', objectId: string, hostId: string, hostName: string, progress: number, twinstorState: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Shut down pinned VMs', hostId: string, hostName: string })
|  |  |  ├─ task.start({ name: `Shutting down VM ${vmId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  │  └─ task.end
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync before rebooting', objectId: string, hostId: string, hostName: string, progress: number, twinstorState: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Waiting for host to be up', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Restart pinned VMs', hostId: string, hostName: string })
|  |  |  ├─ task.start({ name: `Restarting VM ${vmId} on host ${hostId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
├─ task.start({ name: 'Migrate VMs back' })
|  ├─ task.start({ name: `Migrating VMs back to host ${hostId}`, hostId: string, hostName: string })
|  |  ├─ task.start({ name: `Migrating VM ${vmId} back to host ${hostId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
└─ task.end
```

### Rolling pool update

```
task.start({ name: 'Rolling pool update', poolId: string, poolName: string })
├─ task.start({ name: 'Listing missing patches', total: number, progress: number, done: number })
│  ├─ task.start({ name: 'Listing missing patches for host ${hostUuid}', hostId: string, hostName: string })
│  │  └─ task.end
│  └─ task.end
├─ task.start({ name: 'Updating and rebooting' })
│  ├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync', progress: number, twinstorState: string })
│  │  └─ task.end
│  ├─ task.start({ name: 'Installing XS patches' })
│  │  └─ task.end
│  ├─ task.start({ name: 'Restarting hosts', total: number, progress: number, done: number })
│  |  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
│  |  |  ├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync before evacuating', objectId: string, hostId: string, hostName: string, progress: number, twinstorState: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Shut down pinned VMs', hostId: string, hostName: string })
│  |  |  |  ├─ task.start({ name: `Shutting down VM ${vmId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  │  │  └─ task.end
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Installing patches', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Waiting for TWINSTOR storage to be in sync before rebooting', objectId: string, hostId: string, hostName: string, progress: number, twinstorState: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Waiting for host to be up', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Restart pinned VMs', hostId: string, hostName: string })
│  |  |  |  ├─ task.start({ name: `Restarting VM ${vmId} on host ${hostId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  │  │  └─ task.end
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  └─ task.end
│  ├─ task.start({ name: 'Migrate VMs back' })
│  |  ├─ task.start({ name: `Migrating VMs back to host ${hostId}`, hostId: string, hostName: string })
│  |  |  ├─ task.start({ name: `Migrating VM ${vmId} back to host ${hostId}`, hostId: string, hostName: string, vmId: string, vmName: string })
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
└─ task.end
```

If the load balancer was loaded before the rolling pool update, its cooldown and re-enablement are reported as a separate root task. This task starts during cleanup after either success or failure, so its delay does not extend the rolling pool update task. If rolling pool updates overlap or another starts during the cooldown, the load balancer stays disabled and a fresh cooldown starts after the last update ends.

```
task.start({ name: 'Waiting before re-enabling the load balancer', objectId: string, poolId: string, poolName: string })
└─ task.end
```
