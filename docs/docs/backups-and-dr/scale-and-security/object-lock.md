# S3 Object Lock

[Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html) is the immutability mechanism of S3-compatible object storage. This page explains what it actually protects when Xen Orchestra writes to a locked bucket, how to configure the bucket, and which backup settings are compatible with it.

If your backup repository (BR) is a local filesystem, NFS or SMB share, you want the [on-prem immutability service](./immutability.md) instead. The two mechanisms serve the same purpose but behave very differently in practice, so do not transpose the advice from one page to the other.

## Object Lock is not the on-prem model {#not-the-on-prem-model}

The on-prem service makes files genuinely read-only: any attempt to modify or delete a protected backup fails with a permission error, which XO logs. Object Lock works on **object versions**, and it does not block the operations XO performs:

- **Overwriting** an object creates a new version. The write succeeds, and the previous version stays locked.
- **Deleting** an object (without naming a version) creates a _delete marker_. The object disappears from listings, and every version underneath stays locked.

XO never names a version in any request, so on a locked bucket **XO never receives an error**. Backup rotation, chain merges and `cleanVM` all report success. Two consequences follow, and they drive every recommendation below:

- Your data is protected, but **the view XO sees remains fully mutable**. A compromised XO can make backups disappear from the XO interface. Nothing is lost, but getting them back is a manual, S3-side operation: XO has no feature to browse or restore object versions.
- **Storage grows silently.** Every object XO overwrites or deletes stays billable until its retention expires, and no XO metric, log or health check reports it.

<Schema label="On a locked bucket, XO's writes and deletes always succeed: they stack versions and delete markers instead of failing" legend={[["#56c288", "current version, readable"], ["#e0a94a", "locked version, retained and billable"], ["#7a8699", "delete marker"], ["#ef6a5f", "what XO cannot do"]]} maxWidth="640px">
<svg viewBox="0 0 640 240" role="img" aria-label="Diagram of an object key on a locked bucket: an initial write creates a locked current version, an overwrite stacks a second locked version above it, and a delete adds a delete marker on top which hides the object from listings while every version underneath stays retained">
  <text x="86" y="26" fill="#7a8699" fontSize="11" textAnchor="middle">1. XO writes</text>
  <text x="278" y="26" fill="#7a8699" fontSize="11" textAnchor="middle">2. XO overwrites (merge)</text>
  <text x="486" y="26" fill="#7a8699" fontSize="11" textAnchor="middle">3. XO deletes (retention)</text>
  <rect x="20" y="150" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="86" y="172" fill="#c6d2e1" fontSize="11" textAnchor="middle">v1 — current</text>
  <line x1="160" y1="167" x2="176" y2="167" stroke="#7a8699" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="183,167 176,163 176,171" fill="#7a8699" />
  <rect x="212" y="150" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="278" y="172" fill="#c6d2e1" fontSize="11" textAnchor="middle">v1 — retained</text>
  <rect x="212" y="108" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="278" y="130" fill="#c6d2e1" fontSize="11" textAnchor="middle">v2 — current</text>
  <line x1="352" y1="146" x2="368" y2="146" stroke="#7a8699" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="375,146 368,142 368,150" fill="#7a8699" />
  <rect x="420" y="150" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="486" y="172" fill="#c6d2e1" fontSize="11" textAnchor="middle">v1 — retained</text>
  <rect x="420" y="108" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="486" y="130" fill="#c6d2e1" fontSize="11" textAnchor="middle">v2 — retained</text>
  <rect x="420" y="66" width="132" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="#7a8699" strokeDasharray="4 3" />
  <text x="486" y="88" fill="#7a8699" fontSize="11" textAnchor="middle">delete marker</text>
  <text x="486" y="52" fill="#ef6a5f" fontSize="10" textAnchor="middle">XO now sees nothing under this key</text>
  <line x1="20" y1="204" x2="612" y2="204" stroke="#7a8699" strokeWidth="1" />
  <polygon points="620,204 611,200 611,208" fill="#7a8699" />
  <text x="600" y="196" fill="#7a8699" fontSize="10" textAnchor="end">time</text>
  <text x="20" y="226" fill="#e0a94a" fontSize="10">Every operation succeeds; the retained versions are what protects you, and what you pay for</text>
</svg>
</Schema>

## Choose a backup mode that never rewrites data {#choose-a-backup-mode}

This is the single most important decision, and it is not about avoiding errors: it is about whether recovery is possible at all.

Retention on an incremental chain works by **merging**: when the oldest restore point expires, its data is folded into its child, which rewrites a large part of the parent disk. On a locked bucket, every rewritten block leaves a retained version behind. The pre-merge data is technically all still there, but restoring it means rebuilding a coherent set of versions across thousands of block objects, all written at different times. That is not something you can do by hand or realistically script.

If XO only ever **writes new objects and never rewrites them**, recovery becomes trivial: the objects are still there, and undoing an unwanted deletion is only a matter of removing delete markers.

Two configurations give you that:

| Configuration                                                                                                           | Result on a locked bucket                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [**Full backup**](../backup-types/full_backups.md)                                                                      | One self-contained XVA per run. Nothing is ever rewritten. Simplest possible layout, but no file-level restore.                                                                                              |
| [**Incremental backup** with a full backup interval of `1`](../backup-types/incremental_backups.md#key-backup-interval) | Every run is a key (full) backup, so each chain is one restore point long and no merge can ever happen. Keeps the VHD/QCOW2 format, so file-level restore, backup mounting and health checks all still work. |
| Incremental backup with an interval greater than `1`                                                                    | **Not recommended.** Every retention cycle rewrites a parent disk and leaves retained versions behind. Recovery from those versions is not practical.                                                        |

:::tip
A full backup interval of `1` transfers as much data as a full backup on every run: you lose the bandwidth savings of deltas, but you keep the disk format that makes restores flexible. It is the recommended setting for an immutable object-storage BR.
:::

## Long-term retention is not compatible {#long-term-retention}

Do not enable [GFS long-term retention](../backup-features-and-settings.md#long-term-backup-retention-with-gfs-strategy) (daily / weekly / monthly / yearly) on an immutable BR, whether object storage or on-prem.

LTR keeps one restore point per period and deletes the ones in between, which means removing backups from the **middle** of a chain. On an incremental chain that is a merge, with all the consequences described above. Even in a no-rewrite configuration, LTR pins restore points for months or years while the lock retention keeps every superseded version around, so the footprint becomes both large and unpredictable.

The [retention calculator](../calculator.md) refuses the combination for that reason. Use it to size a BR before you create it.

## Configure the bucket {#configure-the-bucket}

### 1. Create the bucket with versioning and Object Lock {#create-the-bucket}

Object Lock requires versioning, and on AWS it **can only be enabled when the bucket is created** (enabling it later requires a support request). Other providers have similar restrictions. You cannot make an existing BR immutable: create a new bucket, then add it as a new BR in XO.

### 2. Set a default retention period {#set-a-default-retention}

:::danger
XO **never sets a retention period on the objects it writes.** It only checks whether Object Lock is enabled on the bucket. If the bucket has Object Lock enabled but **no default retention rule**, your backups get no protection at all, while XO still pays the full performance cost of a locked bucket.
:::

Configure a **default retention** on the bucket (`Object Lock` → `Default retention`). That rule is what applies a retention date to each object as it is uploaded, so every object is protected the moment it lands. Unlike the on-prem service, there is no window during which a freshly written backup is unprotected.

XO also never sets nor clears a **legal hold**. If you place one, XO can never release it, and the objects stay billable indefinitely.

### 3. Prefer governance mode {#prefer-governance-mode}

Object Lock offers two retention modes:

- **Governance**: a user holding `s3:BypassGovernanceRetention` can delete a protected version. XO never sends the bypass header, so XO itself is still unable to touch a protected version.
- **Compliance**: nobody can delete a protected version before it expires, not even the account root.

Unless a regulation requires compliance mode, choose **governance**. It matches the model recommended for [on-prem immutability](./immutability.md#on-prem-immmutability): an administrator with direct access to the storage keeps control, and a misconfigured job that fills the bucket with retained versions can still be cleaned up. In compliance mode, that storage is unrecoverable, and billable, until the retention expires.

### 4. Grant the right permissions {#grant-permissions}

Add `s3:GetBucketObjectLockConfiguration` to the credentials used by the BR. XO reads the lock configuration when it connects to the bucket; if that call is denied, XO cannot tell whether the bucket is locked and defensively applies the upload overhead described in [Performance and cost](#performance-and-cost) anyway.

## Lifecycle rules {#lifecycle-rules}

Lifecycle rules operate outside XO, on data XO believes it owns. A rule that removes or moves an object XO still needs will produce **unrecoverable disks**: XO has no way to detect it, and the failure only surfaces when you try to restore.

:::danger
Never apply a lifecycle rule to the **current** versions of a BR's objects. XO is the only component that may decide when a backup is no longer needed.
:::

| Rule                                                             | Verdict         | Why                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Expiration` on current versions                                 | **Never**       | Deletes backup data XO still references. On an incremental chain, losing any object breaks every restore point that depends on it.                                                                             |
| `Transition` to Glacier, Deep Archive or any cold tier           | **Never**       | Breaks reads, not just deletes. Restores fail, the next backup run fails (XO reads the parent disk's metadata), and `cleanVM` fails. This is the most common misconfiguration we see.                          |
| `NoncurrentVersionExpiration`, with a delay ≥ the lock retention | **Safe**        | Only removes versions that XO already superseded or deleted. Object Lock takes precedence over lifecycle, so a still-protected version is never removed. This is how you reclaim the storage described above.  |
| `ExpiredObjectDeleteMarker`                                      | **Safe**        | Cleans up delete markers left with no version underneath. Pure housekeeping.                                                                                                                                   |
| `AbortIncompleteMultipartUpload`                                 | **Recommended** | XO cleans up its own failed uploads, but a killed backup worker or a rebooted host can leave orphaned upload parts. They are billable and invisible to both object listings and XO. A 7-day rule removes them. |

## Retention and lock duration {#retention-and-lock-duration}

Retention is applied **per object version**, from the moment that version is uploaded. A locked bucket therefore does not mean "my backups are protected": the objects of a single restore point were written at different times and stop being protected at different times, and a chain always loses its protection starting from its oldest object, which is its base full backup. A restore point is only genuinely protected while **every** object it depends on still is.

That is what the two bounds below are about. Both are enforced by the [retention calculator](../calculator.md), which is worth running before you commit to a configuration.

- **Not shorter than one backup chain.** A restore point is only usable if its base full backup is present. Once the full falls out of its retention, the deltas stacked on top of it are still locked but no longer restore anything: you are paying for protected objects that protect nothing. With a full backup interval of `1`, a chain is a single restore point, so this bound is satisfied by any duration — one more reason to prefer that setting.
- **Shorter than the retention window.** The oldest restore point must be deletable by the time retention wants to rotate it out. If the lock duration covers the whole retention window, XO keeps deleting backups that keep piling up as retained versions.

## Performance and cost {#performance-and-cost}

Detecting a locked bucket changes how XO talks to it:

- **Every upload carries a Content-MD5 header.** Object Lock requires it, and computing it while streaming is memory-intensive. Expect higher RAM and CPU usage on the appliance or proxy running the job.
- **The backup list cache is disabled.** XO caches the list of backups per VM in a file on the BR, but that cache cannot be maintained on an immutable BR. Every operation that lists backups (opening the restore view, running a job) re-lists each VM's directory instead. On object storage that means many more `LIST` requests, which are both billed and, on some providers, unreliable at scale: check the notes for your provider in [Object storage support](./object-storage-support.md).
- **Retained versions are billable.** Size the bucket for everything written during the lock window, not for the size of your current backups.

## Limitations {#limitations}

- **XO does not show which backups are protected.** The padlock displayed next to each backup in the restore view is computed from a marker file written by the on-prem service, so it never appears for an object-locked bucket. XO does detect Object Lock when it connects to the bucket, which is what disables the backup list cache and enables the Content-MD5 headers, but that is a property of the bucket, not of a backup: as explained in [Retention and lock duration](#retention-and-lock-duration), a bucket can be locked while a given restore point is already unprotected. Reporting a padlock from the bucket configuration alone would claim a protection that may not exist, so XO reports nothing. Verify protection on the storage side, per object.
- **XO cannot restore an object version.** Recovering a backup deleted by a compromised XO is a manual operation, see below.
- **Provider behaviour varies.** S3-compatible implementations differ on lifecycle-versus-lock precedence and on delete-marker handling. Test your provider before trusting it, and check its tier in [Object storage support](./object-storage-support.md).

## Recovering deleted backups {#recovering-deleted-backups}

If backups were deleted, by a compromised XO or by mistake, the data is still in the bucket as non-current versions. Recovery is done entirely with your provider's tooling, not from XO:

1. Stop the backup jobs targeting that BR, so XO does not write over what you are about to recover.
2. List the object versions and the delete markers for the affected VM's prefix.
3. Remove the delete markers, which makes the previous version current again.
4. Only then, in XO, list the backups of the BR and check that the restore points you expect are back.

This is realistic in a **no-rewrite configuration**, where each object was written once and undoing a deletion is only about delete markers. If the BR holds merged incremental chains, expect the recovery to be partial at best: see [Choose a backup mode](#choose-a-backup-mode).
