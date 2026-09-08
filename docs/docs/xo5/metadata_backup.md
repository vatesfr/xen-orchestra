# Metadata backups

Every XCP-ng or XenServer pool keeps a database, the XAPI database, describing everything that isn't the data itself: VMs and their settings, storage repositories, networks, and how they all fit together. Xen Orchestra has an equivalent of its own: its configuration, holding users, authorizations and resource sets, backup jobs, and plugin settings.

Metadata backup protects both layers, with two backup kinds you can enable independently or together in a single job:

- **Pool metadata backup**: a dump of the pool's XAPI database (VMs, SRs, networks, etc.).
- **XO config backup**: the configuration of your Xen Orchestra instance itself.

This is the backup that saves you when the hardware dies but the storage survives: reinstall a host, restore the pool metadata, and the pool knows about its VMs and SRs again. Likewise, if you lose your XOA, restoring the XO config brings back your users, jobs, and settings without rebuilding them by hand.

<Schema label="Metadata backup: XO dumps the pool's XAPI database and exports its own config to the BR" legend={[["#8e83fe", "Pool"], ["#6aabf0", "XO"], ["#e0a94a", "Backup repository"]]} maxWidth="640px">
<svg viewBox="0 0 640 220" role="img" aria-label="A pool's XAPI database and Xen Orchestra's own configuration both flow into the backup repository, with Xen Orchestra driving the backup">
  <text x="32" y="46" fill="#8e83fe" fontSize="12">Pool</text>
  <rect x="24" y="54" width="180" height="120" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <rect x="44" y="86" width="140" height="52" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" />
  <text x="114" y="109" fill="#c6d2e1" fontSize="12" textAnchor="middle">XAPI database</text>
  <text x="114" y="125" fill="#7a8699" fontSize="10" textAnchor="middle">VMs, SRs, networks</text>
  <rect x="260" y="60" width="130" height="108" rx="8" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="325" y="92" fill="#c6d2e1" fontSize="12" textAnchor="middle">Xen Orchestra</text>
  <text x="325" y="126" fill="#7a8699" fontSize="10" textAnchor="middle">XO config:</text>
  <text x="325" y="140" fill="#7a8699" fontSize="10" textAnchor="middle">users, jobs,</text>
  <text x="325" y="154" fill="#7a8699" fontSize="10" textAnchor="middle">settings, plugins</text>
  <line x1="184" y1="112" x2="250" y2="112" stroke="#8e83fe" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="258,112 249,107 249,117" fill="#8e83fe" />
  <text x="222" y="100" fill="#8e83fe" fontSize="10" textAnchor="middle">dump</text>
  <line x1="390" y1="114" x2="466" y2="114" stroke="#e0a94a" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="474,114 465,109 465,119" fill="#e0a94a" />
  <text x="428" y="102" fill="#e0a94a" fontSize="10" textAnchor="middle">export</text>
  <text x="482" y="46" fill="#c6d2e1" fontSize="12">Backup repository (BR)</text>
  <rect x="474" y="54" width="146" height="120" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <rect x="490" y="72" width="114" height="38" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="547" y="95" fill="#c6d2e1" fontSize="11" textAnchor="middle">pool metadata</text>
  <rect x="490" y="122" width="114" height="38" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="547" y="145" fill="#c6d2e1" fontSize="11" textAnchor="middle">XO config</text>
</svg>
</Schema>

:::note
In the XO 5 interface, backup repositories are still labeled **Remotes**.
:::

## Performing a backup

In **Backup → New**, choose what kind of job you want to create: backing up VMs, or backing up metadata.

<UiDetail src="/img/xo5/metadata-backup-type.png" alt="Backup type choice between Backup VMs and Backup metadata" width={620} />

Selecting **Backup metadata** opens a dedicated job form. Toggle **Pool metadata**, **XO config**, or both at the same time, then pick the pools to cover and the target BR.

<UiDetail src="/img/xo5/metadata-job-form.png" alt="Metadata backup job form with Pool metadata and XO config toggles, target remotes, pools and schedules" width={700} />

Each schedule has its own name and retention, one for pool metadata backups and one for XO config backups. At least one retention must be higher than 0.

<UiDetail src="/img/xo5/metadata-schedule-retention.png" alt="Schedule modal with name, pool retention and XO retention fields" width={620} />

Once saved, the job shows up alongside your other backup jobs, with its modes listed (Pool metadata, XO config).

<UiDetail src="/img/xo5/metadata-job-list.png" alt="Schedules list showing a metadata job with Pool metadata and XO config modes next to a regular backup job" width={700} />

## Performing a restore

:::warning
Restoring pool metadata completely overwrites the XAPI database of a host. Only perform a metadata restore if it is a new server with nothing running on it (eg replacing a host with new hardware).
:::

:::warning
**The XAPI version of the target host must match the one the backup was taken from.** If it
does not, the restore is refused with `RESTORE_INCOMPATIBLE_VERSION` and no data is written.
This matters most in the situation the feature exists for: rebuilding a host after a failure,
where a fresh install from the current ISO is usually several XAPI releases ahead of the
backup.

The backup itself records the version it was taken from, in its `XAPI_Build` field.

To restore onto a rebuilt host:

1. Reinstall XCP-ng.
2. Bring the host to the XAPI level the backup was taken at. If the backup is at the XAPI
   version shipped with the original release of your XCP-ng version, the freshly installed
   host is already at that level and no extra step is needed. Otherwise, install the specific
   updates for that level.
3. Restore the pool metadata.
4. Patch the host to apply the remaining updates.
:::

Go to **Backup → Restore** and click the **Metadata** filter button: the list switches to the metadata backups available for restore, both XO config backups and pool metadata backups.

<UiDetail src="/img/xo5/metadata-restore-list.png" alt="Restore view filtered on metadata, listing a Xen Orchestra config backup and a pool metadata backup" width={620} />

To restore one, click the blue restore arrow on its row, choose the backup date to restore, and click **OK**.

<UiDetail src="/img/xo5/metadata-restore-modal.png" alt="Restore XO metadata modal with a backup date selector" width={480} />

That's it!

:::tip
Metadata backup is one half of protecting your orchestration layer: the other half is keeping the XOA itself recoverable. See [How to ensure XOA is always available](../backup_howto.md#how-to-ensure-xoa-is-always-available).
:::
