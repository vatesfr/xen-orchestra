---
sidebar_label: Incremental replication (CR)
---

# Incremental replication

:::note
**Incremental replication** is the current name of the job type formerly called **Continuous Replication (CR)**. Both names describe the same thing, and you will still meet the old one: XO 6 labels this mode **Incremental replication**, while the XO 5 interface still labels it **Continuous Replication**, and replicas keep a `Continuous Replication` tag.
:::

This feature is an incremental replication system for your XCP-ng or XenServer VMs, **without any storage vendor lock-in**. You can replicate a VM every _X_ minutes or hours to any storage repository (SR): a distant XCP-ng or XenServer host, or simply another local storage target. After the first full transfer, each run only sends the blocks that changed since the previous one.

This feature covers multiple objectives:

- no storage vendor lock-in
- no configuration (agent-less)
- low Recovery Point Objective, from 10 minutes to 24 hours (or more)
- flexibility
- no intermediate storage needed
- atomic replication
- efficient DR (disaster recovery) process

If you lose your main pool, you can start the copy on the other side, with very recent data.

<Schema label="Incremental replication: only the changed blocks travel to the DR side at each run" legend={[["#56c288", "Production VM"], ["#e0a94a", "Standby replica"], ["#6aabf0", "Xen Orchestra"], ["#8e83fe", "XCP-ng pool"]]} maxWidth="640px">
<svg viewBox="0 0 640 270" role="img" aria-label="Xen Orchestra orchestrates an incremental replication job: small deltas of changed blocks travel from the running production VM to a standby replica on the DR SR, whose start operation is blocked">
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
  <text x="320" y="146" fill="#c6d2e1" fontSize="10" textAnchor="middle">delta: changed</text>
  <text x="320" y="158" fill="#c6d2e1" fontSize="10" textAnchor="middle">blocks only</text>

  <g>
    <rect x="-7" y="-4" width="14" height="8" rx="2" fill="rgba(86,194,136,0.25)" stroke="#56c288" strokeWidth="1" />
    <animateMotion dur="4s" repeatCount="indefinite" calcMode="linear" path="M278,177 L360,177" keyPoints="0;1" keyTimes="0;1" />
    <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.1;0.85;1" />
  </g>
  <g>
    <rect x="-5" y="-3" width="10" height="6" rx="2" fill="rgba(86,194,136,0.25)" stroke="#56c288" strokeWidth="1" />
    <animateMotion dur="4s" begin="1.6s" repeatCount="indefinite" calcMode="linear" path="M278,177 L360,177" keyPoints="0;1" keyTimes="0;1" />
    <animate attributeName="opacity" dur="4s" begin="1.6s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.1;0.85;1" />
  </g>

  <rect x="370" y="90" width="240" height="150" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="382" y="112" fill="#7a8699" fontSize="11">DR pool (destination SR)</text>

  <rect x="390" y="124" width="200" height="46" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" strokeWidth="1.5" />
  <text x="490" y="143" fill="#e0a94a" fontSize="11" textAnchor="middle" fontWeight="600">web01 (replica)</text>
  <text x="490" y="159" fill="#7a8699" fontSize="10" textAnchor="middle">halted, start blocked</text>

  <rect x="390" y="180" width="200" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" strokeWidth="1" opacity="0.6" />
  <text x="490" y="197" fill="#e0a94a" fontSize="11" textAnchor="middle" opacity="0.7">replication snapshots</text>
  <text x="490" y="213" fill="#7a8699" fontSize="10" textAnchor="middle" opacity="0.7">one per run (retention)</text>
</svg>
</Schema>

:::warning
It is normal that you can't boot the replicated VM directly: we protect it. The normal workflow is to make a clone and work on the clone.

This protection also covers VMs with "Auto power on" enabled: replicas will not start on your incremental replication destination if you happen to reboot it.
:::

## Configure it

As you'll see, it is trivial to configure. In the "Backup/new" section, select the incremental replication mode: this XO 5 screen still labels the button **Continuous Replication**.

Then:

1. Select the VMs you want to protect
1. Schedule the replication interval
1. Select the destination storage repository (it can be any SR connected to any host!)

That's it! Your VMs are protected and replicated as requested.

To protect the replication, we removed the possibility to boot your replicated VM directly: if you start it, it will break the next delta. The solution is to clone it when you need it (a clone is really quick). You can then do whatever you want with this clone!

## Reverse replication and failback {#reverse-replication}

Since Xen Orchestra 6.5, incremental replication works in both directions: the replication engine can reuse a snapshot it finds in common between the source and the destination, **even if that snapshot was created by another job, running the other way**. This is what the release notes call bidirectional (or symmetrical) replication.

There is no special job type for it. To replicate in the reverse direction, simply create a new incremental replication job going the other way:

1. Select the replica (or the VM running on your DR side) as the source VM
1. Select your original production SR as the destination

On its first run, instead of sending a full copy, the job looks for a common snapshot on both sides (using the content metadata XO writes on every replicated disk) and only transfers the blocks that changed since that snapshot. Then, on the production side:

- If the original VM is halted (or suspended) and its disks haven't changed since the last replication, the job **updates the original VM in place**: no duplicate VM, your production VM simply catches up with what happened on the DR side.
- If the original VM has diverged (or is running), the common snapshot is still used as the delta base, but the job creates a new VM next to it rather than overwriting anything.

This matters in two situations:

- **Failing back after a failover**: your production site went down, you force-started the replica and ran on the DR side for a few hours or days. Once production is repaired, a reverse job brings all the changes back as a delta, without transferring entire VMs across the WAN.
- **Testing or executing a recovery plan**: you can do a planned switch to the DR site, work there, then switch back, with only deltas moving in each direction.

Constraints to be aware of:

- The cross-job snapshot reuse only kicks in when the job has **a single replication target SR** (no additional targets or backup repositories in the same job).
- It relies on the content metadata introduced with this feature: both sides need replication snapshots created by a recent XO (the same-VM reuse arrived in XO 6.3, the cross-direction reuse in XO 6.5). Older chains fall back to a full transfer on the first reverse run.
- As always with incremental replication, don't delete or alter the replication snapshots: they are the common base that makes the reverse run a delta instead of a full.

## Manual initial seed

**If you can't transfer the first backup through your network because it's too large**, you can make a seed locally. To do so, follow this procedure (until we make it accessible directly in XO).

:::tip
This is **only** if you need to make the initial copy without pushing the whole transfer through your network. Otherwise, **you don't need this**.
:::

### Job creation

Create the incremental replication backup job, and leave it disabled for now. On the main Backup page, copy the job's `backupJobId` by hovering to the left of the shortened ID and clicking the copy to clipboard button:

<UiDetail src="/img/xo5/cr-seed-1.png" alt="Copy the backup job ID from the main Backup page" width={700} />

Copy it somewhere temporarily. Now we also need to copy the ID of the job schedule, `backupScheduleId`. Do this by hovering over the schedule name in the same panel as before, and clicking the copy to clipboard button. Keep it with the `backupJobId` you copied previously, as we will need them all later:

<UiDetail src="/img/xo5/cr-seed-2.png" alt="Copy the schedule ID from the same panel" width={700} />

### Seed creation

Manually create a snapshot on the VM being backed up, then copy this snapshot UUID, `snapshotUuid`, from the snapshot panel of the VM:

<UiDetail src="/img/xo5/cr-seed-3.png" alt="Copy the snapshot UUID from the VM's snapshot panel" width={620} />

:::warning
DO NOT ever delete or alter this snapshot. Feel free to rename it to make that clear.
:::

### Seed copy

Export this snapshot to a file, then import it on the target SR.

We need to copy the UUID of this newly created VM as well, `targetVmUuid`:

<UiDetail src="/img/xo5/cr-seed-4.png" alt="Copy the UUID of the imported VM on the target SR" width={620} />

:::warning
DO NOT start this VM or it will break the incremental replication job! You can rename this VM to more easily remember this.
:::

### Set up metadata

The XOA backup system requires metadata to correctly associate the source snapshot and the target VM with the backup job. We're going to use the `xo-cr-seed` utility to set them up.

First install the tool (all the following is done from the XOA VM CLI):

<Terminal shell title="xoa — install the seed utility">{`
sudo npm i -g --unsafe-perm @xen-orchestra/cr-seed-cli
`}</Terminal>

Here is how the utility expects the UUIDs and info passed to it:

<Terminal title="xoa — xo-cr-seed usage">{`
xo-cr-seed
Usage: xo-cr-seed <source XAPI URL> <source snapshot UUID> <target XAPI URL> <target VM UUID> <backup job id> <backup schedule id>

xo-cr-seed v0.2.0
`}</Terminal>

Putting it all together with our values and UUIDs, the command will look like this (it is a long command):

<Terminal shell title="xoa — seed the replication job">{`
xo-cr-seed https://root:password@xen1.company.tld 4a21c1cd-e8bd-4466-910a-f7524ecc07b1 https://root:password@xen2.company.tld 5aaf86ca-ae06-4a4e-b6e1-d04f0609e64d 90d11a94-a88f-4a84-b7c1-ed207d3de2f9 369a26f0-da77-41ab-a998-fa6b02c69b9a
`}</Terminal>

:::warning
If the username or the password of your XCP-ng/XenServer hosts contains special characters, they must use [percent encoding](https://en.wikipedia.org/wiki/Percent-encoding).

An easy way to do this with Node on the command line:

<Terminal title="xoa — percent-encode a password">{`
node -p 'encodeURIComponent(process.argv[1])' -- 'password with special chars :#@'
password%20with%20special%20chars%20%3A%23%40
`}</Terminal>

:::

### Finished

Your backup job should now be working correctly! Manually run the job the first time to check that everything is OK, then enable it. **From now on, only the deltas are sent: your initial seed saved you a LOT of time if you have a slow network.**

### Failover process

In the situation where you need to failover to your destination host, you simply need to start your VMs on the destination side.

:::tip
If you want to start a VM on your destination host without breaking the incremental replication jobs on the other side, make a copy of the VM and start the copy. Otherwise, you will be asked if you would like to force start the VM.
:::

<UiDetail src="/img/xo5/force-start.jpg" alt="The force start confirmation, shown when starting a protected replica" width={480} />

Force starting the most recent replica gets your services back quickly, but it consumes that replica: the job on the (now dead) production side would have to send a new full copy anyway.

Once your production site is back online, use [reverse replication](#reverse-replication) to fail back: create an incremental replication job from the DR side to your production SR. Everything that happened while you were running on the DR site comes back as a delta, and if your original VM is still there and untouched, it is updated in place. When production is up to date, shut down the DR side, restart the original job, and you are back to your normal replication flow.
