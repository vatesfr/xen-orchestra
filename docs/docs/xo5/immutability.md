# Immutability

## What You’ll Find on This Page

This page covers the immutability feature: what it is, why it’s important, and how to set it up, including integration with Amazon S3.

## What Is Immutability?

In backup systems, immutability means that once a backup is created, it cannot be altered or deleted for a set period. This safeguards your backups against ransomware attacks, accidental deletion, or data corruption.

Here’s how it works: You designate a storage repository that Xen Orchestra can write to, but cannot modify during the specified immutability period. Even if an attacker compromises XO, your backups remain untouched. The goal is to ensure that your backup data cannot be deleted, encrypted, or tampered with, unless someone with direct physical or root access to the storage intervenes.

Immutability can be implemented using external services like AWS S3 Object Lock, but Xen Orchestra also offers a native, on-premises solution that doesn’t rely on third-party infrastructure.

### Data Protection Modes

Immutability offers two distinct approaches in data protection, to meet different security and operational needs.

## Why It Matters

Immutability guarantees that your backups stay secure and verifiable over time. It acts as a critical defense against ransomware, human mistakes, or intentional tampering. Additionally, it helps organizations comply with legal requirements by ensuring that data remains unaltered for mandatory retention periods. In essence, immutability turns your backup storage into a write-once, read-many (WORM) archive, protecting your data when it matters most.

## Immutability Approaches

There are two primary models for achieving immutability:

### Object Storage

The first approach leverages **object storage solutions** like Amazon S3, where immutability is enforced using features such as [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html). In this setup, the storage provider itself manages the retention period. Once enabled, backups created by XO cannot be deleted or modified until the lock expires, providing an extra layer of security.

### On-prem Immmutability

The second model is an **on‑premises immutable repository**. It uses a lightweight package, installed on the backup repository. This program monitors and enforces immutability at the file-system level, ensuring that XO itself cannot delete or overwrite existing backups before the end of the retention period.

## Configuring on-Prem Immutability

To set up immutability on your local infrastructure, follow these steps:

### 1. Install the Required Package

1. Make sure **Node.js** is installed on your backup repository machine
2. Install the dedicated XO package globally:

```bash
npm install -g @xen-orchestra/immutable-backups
```

### 2. Configure the Immutability Settings

Create a configuration file at `/etc/xo-immutable-backups/config.toml`, with the following structure:

```toml

liftEvery = "1h"
[remotes.remote1]
root = "/mnt/ssd/vhdblock/"
immutabilityDuration = "7d"
```

#### Mandatory Parameters

- **`liftEvery`**: Define how often the script will check and lift immutabiltiy (e.g., `1h` for every hour).
- Per remote
  - **`root`**: Specifies the directory where Xen Orchestra stores backups.
  - **`immutabilityDuration`**: Defines how long files remain protected from deletion (e.g., `7d` for 7 days).

### 3. Start the Service

Launch the `xo-immutable-remote` service and check its logs (use `systemd`, for example) to confirm it is running correctly. For persistent operation, configure it as a system service.

## How It Works

Once active, any backups written by Xen Orchestra to this repository will be protected for the specified duration. Even if Xen Orchestra is compromised, the immutability configuration remains secure, as it is managed entirely on the backup host.

### Locking

The service watches the backup directory tree in real time. When a backup completes, it waits until the final file (the metadata `.json`) has been fully written to disk, then locks all files belonging to that backup run with the Linux `chattr +i` attribute. This prevents any process — including Xen Orchestra — from modifying or deleting them.

### Lifting

Protection is released automatically once the `immutabilityDuration` has elapsed. The service periodically (every `liftEvery` interval) scans the backup tree, computes the age of each backup from the datetime encoded in its filename, and removes the immutable attribute from any backup that has expired.

The expiry reference is the **datetime in the filename**, not the file's modification time. XO periodically rewrites metadata files for cache updates and reconciliation, which would reset `mtime` and indefinitely defer expiry if that were used instead.

On the first scan after the service starts, all files are checked unconditionally regardless of their current state, to catch anything that may have been missed (e.g. after a crash or restart).

## Working With Immutable Backups

When setting up backup jobs in Xen Orchestra, select your configured immutable remote (whether it's an S3 bucket or an on-premises repository). Define your retention and rotation policies as you normally would. Immutability ensures that existing backups cannot be deleted or altered before their protection period expires, while still allowing new backups to be added.

## Best Practices

### Only Enable on Stable, Healthy Backup Jobs

:::warning
Immutability should only be enabled on backup jobs that are already running correctly and whose retention policy is fully settled.
:::

Immutability and retention are two independent mechanisms, and they can conflict if a backup job is not in a clean state:

- **Jobs that run more than once per schedule** (accidental duplicates, misconfigured triggers) will accumulate extra backups that XO cannot clean up while they are protected. Those backups count against storage but cannot be removed until their immutability duration expires.
- **Backups in an incorrect or partial state** (failed mid-run, inconsistent chain) will be locked in place for the full immutability duration. The normal cleanup scripts cannot remove them, because any attempt to delete or overwrite a protected file raises a permission error (`EPERM`). Those errors are logged, but the files stay.
- **Retention and immutability durations must be aligned.** If the immutability duration is longer than the retention window, XO will keep trying — and failing — to delete backups it considers expired. Set `immutabilityDuration` to be at most equal to the retention period, so that files are only released after XO has already rotated them out.
- **Do not use Long Term Retention (LTR) with immutability.** LTR may select and remove intermediate backups from within a chain — for example, to keep only one backup per month. If any of those intermediate files are still immutable, the deletion fails with `EPERM`. The backup chain is left in an inconsistent state that XO cannot repair until the immutability duration expires.
- **A broken chain root blocks cleanup of the rest of the chain.** In delta backup chains, removing any backup requires starting from the root. If the chain root is in a bad state (missing, corrupted, or partially written) and the remaining files are immutable, the cleanup script cannot remove them either — it encounters `EPERM` on each attempt and leaves the orphaned files in place until they age out naturally.
- **Disks are not protected during upload.** The immutable attribute is applied only after all disk images for a given backup run have been fully uploaded. During the upload window, those files can still be modified or deleted. Coupling immutability with XO's at-rest encryption reduces this exposure, since an encrypted file is useless even if tampered with before locking.

In short: make sure your backup jobs are stable and producing clean results before adding immutability. Applying it to a job that already has problems will lock those problems in place.

### Define a Clear Immutability Policy

Align the **lock duration** with your data retention strategy, compliance requirements, and disaster recovery goals. Make sure the policy reflects both legal obligations and operational needs.

### Secure Your Encryption Keys

Store encryption keys **separately** from your backup data.

:::warning
Losing encryption keys will render backups **permanently unrecoverable**.
:::

### Maintain Independence from Xen Orchestra

The immutability enforcement mechanism **must** operate independently of Xen Orchestra. This ensures that even if an attacker compromises XO, they **cannot** delete or alter existing backups.

### Monitor Storage and Test Recovery

- Track storage capacity closely, as immutability prevents immediate deletion of older backups.
- Plan for additional space to accommodate protected backups over time.
- Test recovery procedures regularly, to make sure immutability does not disrupt your ability to restore data when needed.

## Limitations

Cloud-based solutions such as S3 Object Lock depend on your provider’s implementation; not all S3‑compatible systems behave identically, so always test before production use.

## Conclusion

Immutability adds a critical layer of protection to your backups in Xen Orchestra. Whether you use Amazon S3 or an on-premises repository, the core principle is simple: once a backup is created, you cannot change or delete it until the retention period expires.

By integrating immutability with strong encryption, proactive monitoring, and regular testing, you ensure that your backup data stays secure, reliable, and recoverable, even in the face of ransomware, human error, or malicious attacks. This approach transforms your backup strategy into a robust defense against data loss and corruption.
