---
sidebar_label: Full replication (DR)
---

# Full replication

:::note
**Full replication** is the current name of the job type formerly called **Disaster Recovery (DR)**. Both names describe the same thing, and you will still meet the old one: XO 6 labels this mode **Full replication**, while the XO 5 interface still labels it **Disaster Recovery**, and replicas keep a `Disaster Recovery` tag.

Don't confuse it with disaster recovery in the general sense (the practice of surviving the loss of a site), which is used throughout this page and which both replication modes serve.
:::

Full replication keeps a complete, ready-to-boot copy of your VMs on another storage repository: in the same pool, in a different pool, even on another site. At each run, the whole VM is exported and streamed directly into the destination SR, so a fresh standby copy is always waiting there, powered off and protected against accidental start.

If the production side is lost (hosts, storage or the entire site), you start the replicas on the destination and you are back in business.

<Schema label="Full replication: a ready-to-boot copy of your production VMs, refreshed at each run" legend={[["#56c288", "Production VM"], ["#e0a94a", "Standby replica"], ["#6aabf0", "Xen Orchestra"], ["#8e83fe", "XCP-ng pool"]]} maxWidth="640px">
<svg viewBox="0 0 640 270" role="img" aria-label="Xen Orchestra orchestrates a full replication job: the production VM is streamed to a DR pool where dated standby replicas are kept, with start blocked">
  <rect x="250" y="12" width="140" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" strokeWidth="1.5" />
  <text x="320" y="34" fill="#6aabf0" fontSize="13" textAnchor="middle" fontWeight="600">Xen Orchestra</text>

  <line x1="285" y1="46" x2="150" y2="88" stroke="#6aabf0" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
  <line x1="355" y1="46" x2="490" y2="88" stroke="#6aabf0" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />

  <rect x="30" y="90" width="240" height="150" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="42" y="112" fill="#7a8699" fontSize="11">Production pool</text>

  <rect x="50" y="124" width="200" height="98" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" strokeWidth="1.5" />
  <text x="60" y="143" fill="#8e83fe" fontSize="11">XCP-ng host</text>
  <rect x="70" y="156" width="160" height="46" rx="5" fill="rgba(255,255,255,0.04)" stroke="#56c288" strokeWidth="1.5" />
  <text x="150" y="176" fill="#56c288" fontSize="12" textAnchor="middle" fontWeight="600">VM "web01"</text>
  <text x="150" y="192" fill="#7a8699" fontSize="10" textAnchor="middle">running</text>

  <line x1="270" y1="165" x2="368" y2="165" stroke="#56c288" strokeWidth="1.5" strokeDasharray="5 4" className="schema-flow" />
  <path d="M368 165 l-8 -4 v8 z" fill="#56c288" />
  <text x="320" y="152" fill="#c6d2e1" fontSize="10" textAnchor="middle">full export, streamed</text>

  <rect x="370" y="90" width="240" height="150" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="382" y="112" fill="#7a8699" fontSize="11">DR pool (destination SR)</text>

  <rect x="390" y="124" width="200" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" strokeWidth="1.5" />
  <text x="490" y="141" fill="#e0a94a" fontSize="11" textAnchor="middle" fontWeight="600">web01 - DR job - (20260801)</text>
  <text x="490" y="157" fill="#7a8699" fontSize="10" textAnchor="middle">halted, start blocked</text>

  <rect x="390" y="176" width="200" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" strokeWidth="1" opacity="0.6" />
  <text x="490" y="193" fill="#e0a94a" fontSize="11" textAnchor="middle" opacity="0.7">web01 - DR job - (20260731)</text>
  <text x="490" y="209" fill="#7a8699" fontSize="10" textAnchor="middle" opacity="0.7">previous copy (retention: 2)</text>
</svg>
</Schema>

## Best practices

Disaster recovery is a vast topic and we strongly encourage you to read some literature about it. In short: define the maximum data loss you can accept (RPO) and the maximum downtime you can accept (RTO), then pick the replication frequency and infrastructure that match those numbers.

Full replication helps on the RTO side. There is no restore phase: the export and the import happen at the same time, in one streaming pass, with no intermediate file. [Streaming allows exporting and importing simultaneously](https://xen-orchestra.com/blog/vm-streaming-export-in-xenserver/), so as soon as a run completes, the replica sits on the destination SR, ready to boot.

**The goal is to have your DR VMs ready to boot on a dedicated host or site. A replica that boots is also living proof that the export worked.**

:::tip
You don't have to test replicas by hand: the backup health check feature can automatically clone a replica, boot it and verify that the guest OS comes up, then discard the clone.
:::

## Schedule a full replication job {#schedule-a-dr-task}

Planning a full replication job is very similar to planning a backup or a snapshot: create a new backup job, select the **Full replication** mode (still labelled **Disaster Recovery** in the XO 5 interface), pick the VMs, set a schedule, and choose the destination storage repository (any SR that XO can reach, on any connected pool).

Your replicated VMs will be visible "on the other side" as soon as the first run is done, named after the original VM, the job and the run date, for example: `web01 - DR job - (20260801T040000Z)`.

### Retention

The retention setting (historically called **depth**) is the number of copies kept per replicated VM. At each run, a new copy is imported and the oldest ones beyond the retention count are removed.

Replicas are identified by the backup metadata XO stores on them and by their blocked start operation. Each one also carries a `Disaster Recovery` tag (the tag value kept the former name of the job type), and HA is disabled on it (with an extra **HA disabled** tag when the source VM used HA). A replica you clone, or whose start block you remove, leaves the rotation: you can play with it without the fear of losing it at the next run.

:::warning
Each retained copy is a full VM on the destination SR: a high retention number will lead to huge space usage. Size your DR storage accordingly.
:::

## Network conflicts

If you boot a copy of your production VM while the original is still running, be careful: if they share the same static IP, you'll have trouble.

A good way to test a replica without this kind of problem is to clone it, remove the network interfaces from the clone, and boot it to check that the export went well.

## Protection against accidental start

:::warning
For each replicated VM, XO adds **start** and **start on** as blocked operations. Even a replica with "Auto power on" enabled will not be started if your DR host reboots, and neither HA nor a distracted admin can boot it behind your back.
:::

When you actually need to run a replica, you have two options, and both take it out of the retention rotation:

- **Clone it** (recommended): the clone is instant, boots normally, and the original replica stays in place for the next runs. This is what the block message itself suggests: "Start operation for this vm is blocked, clone it if you want to use it."
- **Remove the blocked operation** on the replica (in the VM advanced tab) and start it directly. XO will no longer treat it as a replica, so the job won't delete it, and the next run will create a fresh copy alongside it.

## Failover

The day the production side is gone, the procedure is short: go to the DR pool, take the most recent replica of each VM, clone it or unblock it, fix the network settings if needed, and start it. Your services are back without waiting for any restore.

Because full replication re-sends the entire VM at each run, its practical RPO is limited by how long a full export takes. If you need more frequent runs and a lower RPO, look at [incremental replication](xo5/incremental_replication.md), which only transfers the changed blocks. To decide how replication fits with your other backup jobs, see the [backup strategy guide](./backup_howto.md).
