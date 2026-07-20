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

Note on granularity: `Evacuate` is a single `host.evacuate` XAPI call, there is no per-VM detail in the tree for that phase. Per-VM subtasks only exist in `Migrate VMs back`.

## Task logs

Rolling pool update and rolling pool reboot task logs have major parts in common.

### Rolling pool reboot

```
task.start({ name: 'Rolling pool reboot', poolId: string, poolName: string })
├─ task.start({ name: 'Restarting hosts', total: number, progress: number, done: number })
|  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
|  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Waiting for host to be up', hostId: string, hostName: string })
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
│  ├─ task.start({ name: 'Installing XS patches' })
│  │  └─ task.end
│  ├─ task.start({ name: 'Restarting hosts', total: number, progress: number, done: number })
│  |  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
│  |  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Installing patches', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Waiting for host to be up', hostId: string, hostName: string })
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
