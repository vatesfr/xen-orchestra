- [File structure on remote](#file-structure-on-remote)
- [Structure of `metadata.json`](#structure-of-metadatajson)
- [Task logs](#task-logs)
  - [During backup](#during-backup)

## File structure on remote

```
<remote>
├─ xo-config-backups
│  └─ <schedule ID>
│     └─ <YYYYMMDD>T<HHmmss>
│        ├─ metadata.json
│        └─ data.json
└─ xo-pool-metadata-backups
   └─ <schedule ID>
      └─ <pool UUID>
         └─ <YYYYMMDD>T<HHmmss>
            ├─ metadata.json
            └─ data
```

## Structure of `metadata.json`

```ts
interface Metadata {
  jobId: String
  jobName: String
  scheduleId: String
  scheduleName: String
  timestamp: number
  pool?: Pool
  poolMaster?: Host
}
```

## Task logs

### During backup

```
job.start(data: { reportWhen: ReportWhen })
├─ task.start(data: { type: 'pool', id: string, pool?: Pool, poolMaster?: Host })
│  ├─ task.start(data: { type: 'remote', id: string })
│  │  └─ task.end
│  └─ task.end
├─ task.start(data: { type: 'xo' })
│  ├─ task.start(data: { type: 'remote', id: string })
│  │  └─ task.end
│  └─ task.end
└─ job.end
```
