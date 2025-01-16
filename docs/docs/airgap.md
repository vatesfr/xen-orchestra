# Deploying XCP-ng and Xen Orchestra in Air-Gapped Environments

This guide explains how to deploy XCP-ng and Xen Orchestra (XO) in air-gapped environments, ensuring that they operate without Internet access.

Air-gapped setups are essential for high-security installations in industries such as defense, healthcare, and energy. By eliminating external connectivity, they greatly reduce risks such as cyber-attacks and data breaches, and provide strong protection for critical systems.

Vates addresses the needs of these environments with offline-enabled solutions for XCP-ng and Xen Orchestra. These solutions do not require the Internet for setup, licensing or registration. They enable organizations to securely and efficiently replace legacy systems such as VMware with a modern virtualization stack.

---

## Table of Contents

1. [XCP-ng in Air-Gapped Environments](#xcp-ng-in-air-gapped-environments)
   - [Initial Pool Setup for Guest UEFI Secure Boot](#initial-pool-setup-for-guest-uefi-secure-boot)
   - [Package Management](#package-management)
     - [Overview](#overview)
     - [Initial Pool Setup for Package Management](#initial-pool-setup-for-package-management)
     - [Set up XCP-ng for XOSTOR (XOSTOR users only!)](#set-up-xcp-ng-for-xostor-xostor-users-only)
     - [Fetching and Installing Updates](#fetching-and-installing-updates)
2. [Xen Orchestra in Air-Gapped Environments](#xen-orchestra-in-air-gapped-environments)
   - [Logical Air Gap Deployment](#logical-air-gap-deployment)
     - [Preparation](#preparation)
     - [Deployment Steps](#deployment-steps)
     - [Upgrading the Environment](#upgrading-the-environment)
   - [Physical Air Gap Deployment](#physical-air-gap-deployment)
     - [Deployment Steps](#deployment-steps)
3. [Contact for Support](#contact-for-support)
4. [Conclusion](#conclusion)

---

## XCP-ng in Air-Gapped Environments

Installing XCP-ng in an air-gapped environment is the same as any other installation, but it requires extra configuration afterward and a different update process.

### Initial Pool Setup for Guest UEFI Secure Boot

To enforce Secure Boot on specific UEFI VMs, you must first configure your pool to support it.  
For detailed information, check out the [Guest UEFI Secure Boot page](https://docs.xcp-ng.org/guides/guest-UEFI-Secure-Boot/) in the XCP-ng documentation.

- If the pool has internet access before being disconnected, run:

  ```bash
  secureboot-certs install
  ```

  This downloads the required certificates.

- Otherwise, download the certificates, transfer them using a physical storage device, and install them manually following the [UEFI Secure Boot Guide](https://docs.xcp-ng.org/guides/guest-UEFI-Secure-Boot/#install-the-default-uefi-certificates-manually).

### Package Management

#### Overview

XCP-ng components are distributed as RPM packages.  
To expand or update XCP-ng, RPM repositories are typically used online. In an air-gapped environment, these repositories must be transferred to the XCP-ng hosts for local access. The key repositories are:

- **`xcp-ng-base`**: Base version of all our RPMs as of an initial release of XCP-ng.
- **`xcp-ng-updates`**: Updates for security, bug fixes, and enhancements.
- **`xcp-ng-linstor`** (only for XOSTOR users): Repository for XOSTOR-specific components.

You can download the repositories and a utility script from the [Vates offline repository](https://repo.vates.tech/xcp-ng/offline/8/).

**Note:** In the Vates offline repository, repository identifiers may be used without the `xcp-ng-` prefix, such as: `base`, `updates`, or `linstor`.

#### Initial Pool Setup for Package Management

After installation, we need to set up the local RPM repositories to replace the online ones.

1. **Prepare the update material**

- Download the required archives and script:

  - The `setup_offline_xcpng_repos` script from [GitHub](https://github.com/xcp-ng/xcp/tree/master/scripts/setup_offline_xcpng_repos).
  - The appropriate `.tar` archives for your version of XCP-ng from the [Vates offline repository](https://repo.vates.tech/xcp-ng/offline/8/).

- In the following steps, replace `{VERSION}` with the actual version, following the `X_Y` format. For example, `8_2` for _XCP-ng 8.2_.

  - **Base Repository (`xcp-ng-base`)**
    - Generic file name: `xcpng-{VERSION}-offline-base-latest.tar`
    - Example file name for XCP-ng 8.2: `xcpng-8_2-offline-base-latest.tar`
    - **Note:** This archive is frozen and does not receive updates over time. Once downloaded and set up, no further updates are necessary.
  - **Updates Repository (`xcp-ng-updates`)**

    - Generic file name: `xcpng-{VERSION}-offline-updates-latest.tar`
    - Example file name for XCP-ng 8.2: `xcpng-8_2-offline-updates-latest.tar`
    - **Note:** This archive is regularly updated with new releases. Download the latest version periodically and refresh the local repository on each XCP-ng host to keep it up to date.

  - **Linstor Repository (`xcp-ng-linstor`)** - For XOSTOR users only!
    - Generic file name: `xcpng-{VERSION}-offline-linstor-latest.tar`
    - Example file name for XCP-ng 8.2: `xcpng-8_2-offline-linstor-latest.tar`
    - **Note:** This is only required if you plan to use XOSTOR. Like the `updates` archive, this one is also updated periodically.

  Transfer the utility script and downloaded archives to a removable or appropriate storage device.

  **Note: Alternate Archive Names**

  In the instructions above, we used archives with names ending in `-latest.tar`. The advantage of this is that the download link remains constant. The drawback is that the version is not visible in the file name.

  If you prefer filenames that provide more information, you can download the latest versions instead, named following the pattern `xcpng-{VERSION}-offline-{REPONAME}-{YYYYMMDD}.tar`.

  For example: `xcpng-8_2-offline-updates-20241015.tar`.

2. **Transfer files to hosts**

- Make sure that hosts have enough disk space for both the archives and their extracted contents.  
  The XCP-ng system itself uses only a small portion of the 18 GB system partition, so this is usually not a problem. However, the system partition must never be completely filled.

- Copy the script and archives to the `/root` directory of each server, or connect a physical storage device.

**Note:** As of November 2024, the base archive for XCP-ng 8.2 is around 1.5 GB, and the `updates` archive is about 700 MB. You should allocate around 5 GB if you're copying the archives to disk before extraction.

3. **Set up the offline repositories**

   1. For each host in your pool:

      1. Navigate to the directory containing the archives
      2. Run these commands (as root) to install the local repositories:

      ```bash
      ./setup_offline_xcpng_repos NAME_OF_BASE_ARCHIVE.tar
      ./setup_offline_xcpng_repos NAME_OF_UPDATES_ARCHIVE.tar
      ```

      The script will copy the contents of the archives to `/var/local/xcp-ng-repos` and configure `yum` to use them as local repositories.

      **Note:** This will overwrite the repository definitions in `/etc/yum.repos.d/xcp-ng.repo`, so after this step, you will no longer be able to install updates from the online repositories.

      Example with XCP-ng 8.2:

      ```
      [18:25 hpmc28 ~]# ./setup_offline_xcpng_repos xcpng-8_2-offline-base-latest.tar
      2024-11-06 18:28:35,926 - INFO - Tar archive is valid and not corrupted.
      2024-11-06 18:28:36,066 - INFO - Processing repo: base
      2024-11-06 18:28:36,067 - INFO - Creating directory: /var/local/xcp-ng-repos
      2024-11-06 18:28:36,077 - INFO - Extracting archive...
      2024-11-06 18:29:04,127 - INFO - Extracted base to /var/local/xcp-ng-repos
      2024-11-06 18:29:04,129 - INFO - Deleting existing repository file: /etc/yum.repos.d/xcp-ng.repo
      2024-11-06 18:29:04,129 - INFO - Creating repository file: /etc/yum.repos.d/xcp-ng.repo
      2024-11-06 18:29:04,130 - INFO - Appending repository definition for [xcp-ng-base] to /etc/yum.repos.d/xcp-ng.repo
      2024-11-06 18:29:04,130 - INFO - Deleting yum cache: /var/cache/yum

      [18:34 hpmc28 ~]# ./setup_offline_xcpng_repos xcpng-8_2-offline-updates-latest.tar
      2024-11-06 18:34:41,149 - INFO - Tar archive is valid and not corrupted.
      2024-11-06 18:34:41,204 - INFO - Processing repo: updates
      2024-11-06 18:34:41,205 - INFO - Extracting archive...
      2024-11-06 18:34:48,260 - INFO - Extracted updates to /var/local/xcp-ng-repos
      2024-11-06 18:34:48,353 - INFO - Appending repository definition for [xcp-ng-updates] to /etc/yum.repos.d/xcp-ng.repo
      ```

   2. (Optional): To check the results, run `yum repolist -q`:

      ```
      [18:36 hpmc28 ~]# yum repolist -q
      repo id                        repo name                                         status
      xcp-ng-base                    XCP-ng Offline Base Repository                     2 038
      xcp-ng-updates                 XCP-ng Offline Updates Repository                    366
      ```

   3. (Optional): If you copied the archive to the local disk, you can delete it to free up space.

4. **Apply the updates**

   Once all the hosts in the pool have their local repositories updated, you can follow [the regular update guide](https://docs.xcp-ng.org/management/updates/).  
    You can also use Xen Orchestra to apply updates.

   **Note:** Keep in mind that Xen Orchestra will only detect updates from the local repositories, so it won't notify you if new updates are available on the online mirrors.

#### Set up XCP-ng for XOSTOR (XOSTOR users only!)

Normally, Xen Orchestra handles XOSTOR installation. However, for air-gapped environments, manual setup is required.

1. Make sure the `base` and `updates` offline repositories are set up, and that the `updates` repository is up to date or matches the `linstor` archive release date.

2. Make sure the hosts are up to date.  
   If you’ve followed the steps above, your hosts should already be updated.

3. With the `.tar` archive of the `linstor` repository and the `setup_offline_xcpng_repos` script available in a directory or mount point, navigate to that directory and run the following command as root:

```
./setup_offline_xcpng_repos NAME_OF_LINSTOR_ARCHIVE.tar
```

Example with XCP-ng 8.2:

```
[18:55 hpmc28 ~]# ./setup_offline_xcpng_repos xcpng-8_2-offline-linstor-latest.tar
2024-11-06 18:55:11,997 - INFO - Tar archive is valid and not corrupted.
2024-11-06 18:55:12,007 - INFO - Processing repo: linstor
2024-11-06 18:55:12,010 - INFO - Extracting archive...
2024-11-06 18:55:12,298 - INFO - Extracted linstor to /var/local/xcp-ng-repos
2024-11-06 18:55:12,299 - INFO - Creating repository file: /etc/yum.repos.d/xcp-ng-linstor.repo
2024-11-06 18:55:12,300 - INFO - Appending repository definition for [xcp-ng-linstor] to /etc/yum.repos.d/xcp-ng-linstor.repo
```

4. Install the `xcp-ng-linstor` package with its dependencies:

```
yum install xcp-ng-linstor -y
```

5. Restart the XAPI toolstack:

```
xe-toolstack-restart
```

6. Once installed on all hosts in the pool, **use the Xen Orchestra XOSTOR configuration wizard** to configure the storage repository.

#### After the initial setup

Your hosts are now properly configured. Please proceed to the next section for instructions on how to apply updates.

### Fetching and Installing Updates

We regularly release updates for supported versions of XCP-ng. This section explains how to fetch and install them.

#### Define an update schedule or follow our update announcements

You can either follow our update announcements at the [XCP-ng blog](https://xcp-ng.org/blog/tag/update/) or set up a periodic update schedule.

#### Prepare the update materials (again)

Follow the instructions in the **Prepare the update material** section.

The `base` repository doesn’t need updating since it remains unchanged. However, the `updates` repository and, if applicable, the `linstor` repository need to be updated. If you're using both, update them simultaneously.
section
Also, download the latest version of the `setup_offline_xcpng_repos` script from [GitHub](https://github.com/xcp-ng/xcp/tree/master/scripts/setup_offline_xcpng_repos).

#### Transfer the script and archives to the hosts (again)

Refer to the **Transfer files to hosts** section.

#### Refresh the offline repositories with the new archives

Updating a local repository follows the same steps as the initial installation.  
Typically, you'll need to update the `updates` repository and, if applicable, the `linstor` repository:

```
./setup_offline_xcpng_repos NAME_OF_UPDATES_ARCHIVE.tar
```

And, if applicable:

```
./setup_offline_xcpng_repos NAME_OF_LINSTOR_ARCHIVE.tar
```

Example with XCP-ng 8.2 without XOSTOR:

```
[18:36 hpmc28 ~]# ./setup_offline_xcpng_repos xcpng-8_2-offline-updates-latest.tar
2024-11-06 18:41:05,649 - INFO - Tar archive is valid and not corrupted.
2024-11-06 18:41:05,695 - INFO - Processing repo: updates
2024-11-06 18:41:05,695 - INFO - Removing existing directory: /var/local/xcp-ng-repos/updates
2024-11-06 18:41:10,002 - INFO - Extracted updates to /var/local/xcp-ng-repos
2024-11-06 18:41:10,005 - INFO - Deleting yum cache: /var/cache/yum
```

This completely replaces the previous version of the repository with the updated one in `/var/local/xcp-ng-repos/{REPONAME}`.

If you copied the archive to the local disk, you can delete it to free up space.

**Date of the last repository update**

To check the date of the last repository update, run this command:

```
[18:41 hpmc28 ~]# ls -l /var/local/xcp-ng-repos/
total 8
drwxr-xr-x 3 root root 4096  6 nov.  18:28 base
drwxr-xr-x 3 root root 4096  6 nov.  18:41 updates
```

#### 4. Apply updates

Once all hosts in the pool have their local repositories updated, follow the [regular update guide](https://docs.xcp-ng.org/management/updates/).

You can also use Xen Orchestra to apply updates.  
Keep in mind that Xen Orchestra will only detect updates from the local repositories, so it won't notify you if new updates are available on the online mirrors.

**Warning:** If you're using XOSTOR, refer to the [XOSTOR documentation](https://docs.xcp-ng.org/xostor/) for specific update instructions.

---

## Xen Orchestra in Air-Gapped Environments

### Logical Air Gap Deployment

#### Preparation

1. Set up a QA or pre-production XCP-ng pool, with Internet access.
2. Deploy and configure Xen Orchestra Appliance (XOA) following the [standard procedure](https://xen-orchestra.com/docs/installation.html).
3. Ensure XOA is:
   - Properly registered (see the [registration instructions](https://xen-orchestra.com/docs/installation.html#registration)).
   - Up-to-date (see the [XOA Update guide](https://xen-orchestra.com/docs/updater.html)).
   - Verified using [XOA checks](https://xen-orchestra.com/docs/xoa.html#xoa-check).

#### Deployment Steps

1. Shut down XOA on the QA/pre-production pool:
   ```bash
   xe vm-shutdown uuid=$uuid
   ```
2. Export XOA as an XVA file:
   ```bash
   xe vm-export compress=true uuid=$uuid filename=xoa.xva
   ```
3. Transfer the `xoa.xva` file to your air-gapped pool.
4. Import the XOA into the air-gapped pool:
   ```bash
   xe vm-import filename=xoa.xva
   ```
5. Start the imported XOA:
   ```bash
   xe vm-start uuid=<new-xoa-uuid>
   ```
6. Delete the XOA from the QA/pre-production pool if no longer required.

#### Upgrading the Environment

Follow the same steps as the initial deployment, replacing the older version with the updated version.

### Physical Air Gap Deployment

1. Get the pre-configured XOA and deployment script from Vates.
2. Transfer the XOA file (`XOA.xva`) and the deployment script (`deploy.sh`) to your air-gapped XCP-ng host.
3. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```
4. Run the deployment script with the XOA file:
   ```bash
   ./deploy.sh XOA.xva
   ```
5. Follow the prompts to configure the network settings, including:
   - IP
   - DNS
   - NTP

---

## Contact for Support

For further assistance or to obtain a custom air-gap solution, please contact [Vates Support](https://vates.tech/contact).

---

## Conclusion

Deploying XCP-ng and Xen Orchestra in air-gapped environments is a robust solution for organizations prioritizing security and isolation. Whether through logical or physical air gaps, these setups ensure critical infrastructure operates without exposure to external threats. By leveraging Vates’ tailored solutions, users can maintain operational efficiency, streamline offline upgrades, and meet stringent compliance requirements. Reach out to Vates support to discuss your unique deployment needs and enhance the reliability of your air-gapped infrastructure.
