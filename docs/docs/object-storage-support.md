# Object storage support

## Introduction

Xen Orchestra is compatible with a wide range of S3-compatible object storage solutions. Based on our testing and validation, we categorize storage providers into three tiers to help you understand their expected reliability and performance.


## Storage tiers explained

- **Tier 1** providers are extensively tested in our labs. We ensure Xen Orchestra aligns with their implementation and performs reliably, even at scale.

- **Tier 2** providers closely resemble Tier 1 solutions in behavior. While we offer support, minor differences may exist, and large-scale testing might be limited.

- **Tier 3** providers have implementations that differ more significantly from Tier 1. Support is provided on a best-effort basis, and some operations may be less reliable.

## Supported storage providers
   Provider         | Tier | Notes                                                                                     |
 |------------------|------|-------------------------------------------------------------------------------------------|
 | **AWS / S3**     | 1    | Fully tested and validated for reliability at scale.                                      |
 | **Wasabi**       | 2    | Behaves similarly to Tier 1 but with less extensive large-scale testing.                  |
 | **CleverCloud**  | 2    | Behaves similarly to Tier 1 but with less extensive large-scale testing.                  |
 | **Backblaze / B2** | 3  | The `list` operation may time out, which will cause irrecuperrable errors during the `cleanVM` phase     |
 | **MinIO**        | 2 or 3 | Depends on performance; large deployments may experience slower operations.              |
 | **Ceph** (on-premise) | 2 or 3 | Depends on performance; large deployments may experience slower operations.              |
 | **NetApp**       | 2    | Tier 2 support applies to ONTAP version 9.16 or later.                                    |

## What this means for your backups

Even if your storage provider is classified as Tier 2 or 3, **any successfully completed backup can always be restored**. The most demanding part of the backup process—cleaning and merging old data—is where tier differences matter most. Once a backup is complete, restoration is fully supported regardless of the storage tier.

Currently, we don’t have a formal validation program for every provider. This list reflects our hands-on experience working with users to ensure their backups remain secure.

## Help us improve storage support

We welcome collaboration with storage providers interested in pre-validating their platforms. If you can provide access and have active users, we’re happy to work with you.

If you’re using a storage solution at scale—whether successfully or with challenges—your feedback is invaluable. Reach out to us so we can refine the list and enhance support for the entire community.