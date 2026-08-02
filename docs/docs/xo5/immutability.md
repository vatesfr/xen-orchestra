# Immutability

This page covers the immutability feature: what it is, why it matters, and how to set it up, whether you rely on object storage like Amazon S3 or on the native on-prem service.

## What is immutability? {#what-is-immutability}

In backup systems, immutability means that once a backup is created, it cannot be altered or deleted for a set period. This safeguards your backups against ransomware attacks, accidental deletion, or data corruption.

Here is how it works: you designate a backup repository (BR) that Xen Orchestra can write to, but cannot modify during the specified immutability period. Even if an attacker compromises XO, your backups remain untouched. The goal is to ensure that your backup data cannot be deleted, encrypted, or tampered with, unless someone with direct physical or root access to the storage intervenes.

Immutability can be implemented using external services like AWS S3 Object Lock, but Xen Orchestra also offers a native, on-premises solution that doesn't rely on third-party infrastructure.

## Why it matters {#why-it-matters}

Immutability guarantees that your backups stay secure and verifiable over time. It acts as a critical defense against ransomware, human mistakes, or intentional tampering. Additionally, it helps organizations comply with legal requirements by ensuring that data remains unaltered for mandatory retention periods. In essence, immutability turns your BR into a write-once, read-many (WORM) archive, protecting your data when it matters most.

## Immutability approaches {#immutability-approaches}

<a id="data-protection-modes"></a>

Immutability offers two distinct approaches to data protection, to meet different security and operational needs.

### Object storage {#object-storage}

The first approach leverages **object storage solutions** like Amazon S3, where immutability is enforced using features such as [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html). In this setup, the storage provider itself manages the retention period. Once enabled, backups created by XO cannot be deleted or modified until the lock expires, providing an extra layer of security.

### On-prem immutability {#on-prem-immmutability}

The second model is an **on-premises immutable repository**. It uses a lightweight package, installed on the BR host itself. This service monitors the repository and enforces immutability at the filesystem level, ensuring that XO cannot delete or overwrite existing backups before the end of the protection period.

The protection follows a **governance** model: the local root account of the BR host can still lift immutability. This is by design, so that an administrator with direct access to the storage always keeps control.

:::tip
The immutability engine was rewritten in 2026 on native filesystem APIs. It uses roughly 7 times less memory and locks and unlocks files much faster on large repositories, so it scales to BRs holding many VMs and disks. The new engine shipped with the XO 6.3 release.
:::

## Configuring on-prem immutability {#configuring-on-prem-immutability}

To set up immutability on your local infrastructure, follow these steps:

### 1. Install the required package {#1-install-the-required-package}

1. Make sure **Node.js** (version 20 or later) is installed on your BR machine
2. Install the dedicated XO package globally:

<Terminal shell title="On the backup repository host">{`npm install -g @xen-orchestra/immutable-backups`}</Terminal>

The host must also meet these requirements:

- `chattr` and `lsattr` must be available on the system.
- The underlying filesystem must support the immutable attribute (ext4, btrfs, and other common Linux filesystems do).
- The service must run as root, or as a user with the `CAP_LINUX_IMMUTABLE` capability.

### 2. Configure the immutability settings {#2-configure-the-immutability-settings}

Create a configuration file at `/etc/xo-immutable-backups/config.toml`, with the following structure:

```toml
liftEvery = "1h"

[remotes.remote1]
root = "/mnt/ssd/vhdblock/"
immutabilityDuration = "7d"
```

#### Mandatory parameters {#mandatory-parameters}

- **`liftEvery`**: Defines how often the service checks for expired protection and lifts immutability (e.g., `1h` for every hour).
- Per backup repository (the `remotes` key in the configuration file keeps the legacy name):
  - **`root`**: Absolute path to the directory where Xen Orchestra stores backups.
  - **`immutabilityDuration`**: Defines how long files remain protected from deletion (e.g., `7d` for 7 days). The minimum accepted value is `1d`.

You can declare as many `[remotes.<id>]` sections as you have repositories to protect on the host.

### 3. Start the service {#3-start-the-service}

Launch the `xo-immutable-remote` daemon and check its logs (with `journalctl`, for example) to confirm it is running correctly. For persistent operation, configure it as a `systemd` service so it starts at boot and keeps running: the daemon must stay up to protect new backups as they are written.

## How it works {#how-it-works}

Once active, any backups written by Xen Orchestra to this repository will be protected for the specified duration. Even if Xen Orchestra is compromised, the immutability configuration remains secure, as it is managed entirely on the backup host. On startup, the service verifies that the filesystem actually supports the immutable attribute, then writes a locked `immutability.json` marker at the repository root before it starts watching for new backups.

<Schema label="A backup's life on an immutable BR: written, locked for immutabilityDuration, lifted, then rotated out by retention" legend={[["#56c288", "written, still mutable"], ["#e0a94a", "locked backup"], ["#ef6a5f", "deleted by retention"], ["#5ac8c8", "liftEvery scan"]]} maxWidth="640px">
<svg viewBox="0 0 640 200" role="img" aria-label="Timeline of a backup on an immutable repository: written unlocked, locked with chattr +i for the immutability duration, lifted back to mutable, then deleted by retention, with periodic liftEvery scans ticking along the time axis">
  <rect x="14" y="44" width="132" height="56" rx="8" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="80" y="68" fill="#c6d2e1" fontSize="12" textAnchor="middle">Written</text>
  <text x="80" y="86" fill="#7a8699" fontSize="10" textAnchor="middle">still unlocked</text>
  <line x1="149" y1="72" x2="164" y2="72" stroke="#e0a94a" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="171,72 164,68 164,76" fill="#e0a94a" />
  <rect x="174" y="44" width="132" height="56" rx="8" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <rect x="206" y="63" width="11" height="9" rx="1.5" fill="none" stroke="#e0a94a" />
  <path d="M208.5 63 v-3 a3 3 0 0 1 6 0 v3" fill="none" stroke="#e0a94a" />
  <text x="248" y="72" fill="#c6d2e1" fontSize="12" textAnchor="middle">Locked</text>
  <text x="240" y="88" fill="#e0a94a" fontSize="10" textAnchor="middle">chattr +i</text>
  <line x1="174" y1="112" x2="306" y2="112" stroke="#e0a94a" strokeWidth="1.5" />
  <line x1="174" y1="107" x2="174" y2="117" stroke="#e0a94a" strokeWidth="1.5" />
  <line x1="306" y1="107" x2="306" y2="117" stroke="#e0a94a" strokeWidth="1.5" />
  <text x="240" y="128" fill="#e0a94a" fontSize="10" textAnchor="middle">immutabilityDuration</text>
  <line x1="309" y1="72" x2="324" y2="72" stroke="#7a8699" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="331,72 324,68 324,76" fill="#7a8699" />
  <rect x="334" y="44" width="132" height="56" rx="8" fill="rgba(255,255,255,0.04)" stroke="#7a8699" />
  <text x="400" y="68" fill="#c6d2e1" fontSize="12" textAnchor="middle">Lifted</text>
  <text x="400" y="86" fill="#7a8699" fontSize="10" textAnchor="middle">mutable again</text>
  <line x1="469" y1="72" x2="484" y2="72" stroke="#ef6a5f" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="491,72 484,68 484,76" fill="#ef6a5f" />
  <rect x="494" y="44" width="132" height="56" rx="8" fill="rgba(255,255,255,0.04)" stroke="#ef6a5f" />
  <text x="560" y="68" fill="#c6d2e1" fontSize="12" textAnchor="middle">Deleted</text>
  <text x="560" y="86" fill="#7a8699" fontSize="10" textAnchor="middle">by retention, later</text>
  <line x1="14" y1="156" x2="612" y2="156" stroke="#7a8699" strokeWidth="1" />
  <polygon points="620,156 611,152 611,160" fill="#7a8699" />
  <text x="600" y="146" fill="#7a8699" fontSize="10" textAnchor="end">time</text>
  <line x1="60" y1="150" x2="60" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="130" y1="150" x2="130" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="200" y1="150" x2="200" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="270" y1="150" x2="270" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="340" y1="150" x2="340" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="410" y1="150" x2="410" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="480" y1="150" x2="480" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <line x1="550" y1="150" x2="550" y2="162" stroke="#5ac8c8" strokeWidth="1.5" />
  <text x="312" y="182" fill="#5ac8c8" fontSize="10" textAnchor="middle">liftEvery scan: each tick lifts any expired lock</text>
</svg>
</Schema>

### Locking {#locking}

The service watches the backup directory tree in real time. When a backup completes, it waits until the final file (the metadata `.json`, always written last by XO) has been fully written to disk, then locks all files belonging to that backup run with the Linux `chattr +i` attribute. This prevents any process, including Xen Orchestra, from modifying or deleting them.

### Lifting {#lifting}

Protection is released automatically once the `immutabilityDuration` has elapsed. The service periodically (every `liftEvery` interval) scans the backup tree, computes the age of each backup from the datetime encoded in its filename, and removes the immutable attribute from any backup that has expired.

The expiry reference is the **datetime in the filename**, not the file's modification time. XO periodically rewrites metadata files for cache updates and reconciliation, which would reset `mtime` and indefinitely defer expiry if that were used instead.

On the first scan after the service starts, all files are checked unconditionally regardless of their current state, to catch anything that may have been missed (e.g. after a crash or restart).

## Working with immutable backups {#working-with-immutable-backups}

When setting up backup jobs in Xen Orchestra, select your configured immutable backup repository (whether it's an S3 bucket or an on-premises one). Define your retention and rotation policies as you normally would. Immutability ensures that existing backups cannot be deleted or altered before their protection period expires, while still allowing new backups to be added.

## Best practices {#best-practices}

### Only enable on stable, healthy backup jobs {#only-enable-on-stable-healthy-backup-jobs}

:::warning
Immutability should only be enabled on backup jobs that are already running correctly and whose retention policy is fully settled. Nothing will be lost, but there will be a lot of EACCESS/EPERM errors in the backup log.
:::

Immutability and retention are two independent mechanisms, and they can conflict if a backup job is not in a clean state:

- **Jobs that run more than once per schedule** (accidental duplicates, misconfigured triggers) will accumulate extra backups that XO cannot clean up while they are protected. Those backups count against storage but cannot be removed until their immutability duration expires.
- **Backups in an incorrect or partial state** (failed mid-run, inconsistent chain) will be locked in place for the full immutability duration. The normal cleanup scripts cannot remove them, because any attempt to delete or overwrite a protected file raises a permission error (`EPERM`). Those errors are logged, but the files stay.
- **Retention and immutability durations must be aligned.** If the immutability duration is longer than the retention window, XO will keep trying, and failing, to delete backups it considers expired. Set `immutabilityDuration` to be at most equal to the retention period, so that files are only released after XO has already rotated them out.
- **Do not use Long Term Retention (LTR) with immutability.** LTR may select and remove intermediate backups from within a chain, for example to keep only one backup per month. If any of those intermediate files are still immutable, the deletion fails with `EPERM`. The backup chain is left in an inconsistent state that XO cannot repair until the immutability duration expires.
- **A broken chain root blocks cleanup of the rest of the chain.** In delta backup chains, removing any backup requires starting from the root. If the chain root is in a bad state (missing, corrupted, or partially written) and the remaining files are immutable, the cleanup script cannot remove them either: it encounters `EPERM` on each attempt and leaves the orphaned files in place until they age out naturally.
- **Disks are not protected during upload.** The immutable attribute is applied only after all disk images for a given backup run have been fully uploaded. During the upload window, those files can still be modified or deleted. Coupling immutability with XO's at-rest encryption reduces this exposure, since an encrypted file is useless even if tampered with before locking.

In short: make sure your backup jobs are stable and producing clean results before adding immutability. Applying it to a job that already has problems will lock those problems in place.

### Define a clear immutability policy {#define-a-clear-immutability-policy}

Align the **lock duration** with your data retention strategy, compliance requirements, and disaster recovery goals. Make sure the policy reflects both legal obligations and operational needs.

### Secure your encryption keys {#secure-your-encryption-keys}

Store encryption keys **separately** from your backup data.

:::warning
Losing encryption keys will render backups **permanently unrecoverable**.
:::

### Maintain independence from Xen Orchestra {#maintain-independence-from-xen-orchestra}

The immutability enforcement mechanism **must** operate independently of Xen Orchestra. This ensures that even if an attacker compromises XO, they **cannot** delete or alter existing backups.

### Monitor storage and test recovery {#monitor-storage-and-test-recovery}

- Track storage capacity closely, as immutability prevents immediate deletion of older backups.
- Plan for additional space to accommodate protected backups over time.
- Test recovery procedures regularly, to make sure immutability does not disrupt your ability to restore data when needed.

## Limitations {#limitations}

Cloud-based solutions such as S3 Object Lock depend on your provider's implementation; not all S3-compatible systems behave identically, so always test before production use. See the [supported object storage providers](./object-storage-support.md) list and its support tiers.

## Troubleshooting {#troubleshooting}

For troubleshooting, refer to the [package README on GitHub](https://github.com/vatesfr/xen-orchestra/blob/master/%40xen-orchestra/immutable-backups/README.md). It covers the most common situations: files still immutable after the duration expired, making a repository or a single VM mutable again for manual cleanup, changing the immutability duration, and why incremental backups are only marked as protected in XO once their whole chain is inside the immutability window.

## Conclusion {#conclusion}

Immutability adds a critical layer of protection to your backups in Xen Orchestra. Whether you use Amazon S3 or an on-premises repository, the core principle is simple: once a backup is created, you cannot change or delete it until the protection period expires.

By integrating immutability with strong encryption, proactive monitoring, and regular testing, you ensure that your backup data stays secure, reliable, and recoverable, even in the face of ransomware, human error, or malicious attacks. This approach transforms your backup strategy into a robust defense against data loss and corruption.
