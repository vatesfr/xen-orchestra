# xo-repair-iso

Live ISO that prepares a VM migrated from VMware to boot on XCP-ng.

XO attaches the ISO to the migrated VM, boots it from the CD drive, and reads
the result from `VM.xenstore_data`. The ISO inspects the guest disks and, in
`repair` mode, applies offline the changes the guest needs on XCP-ng: Xen PV
drivers in the initramfs, VMware tools disabled, XCP-ng guest tools
installed, and so on. It then powers the VM off. The repair runs inside the
target VM, so it sees the real XCP-ng virtual hardware, and everything is done
before the guest OS ever boots on XCP-ng.

## Supported guests

"Validated" means: installed on ESXi 8 with the VMware defaults (PVSCSI or
LSI SAS, vmxnet3 or e1000e, open-vm-tools / VMware Tools), imported with XO,
repaired by the ISO, then booted on XCP-ng with no manual step. The guest
runs on PV disk and NIC, and XO gets the OS, the agent version, the memory
and the IP addresses.

### Fully supported

| Family      | Validated                                                                  | Initramfs                 | Guest agent                      | Network configuration     |
| ----------- | -------------------------------------------------------------------------- | ------------------------- | -------------------------------- | ------------------------- |
| Debian      | 13 (BIOS, UEFI)                                                            | initramfs-tools           | `.deb`                           | ifupdown                  |
| Ubuntu      | 22.04 (UEFI), 24.04 (BIOS), 26.04 desktop (UEFI)                           | initramfs-tools           | `.deb`                           | netplan, NetworkManager   |
| RHEL family | CentOS 7.3, Rocky 8.10, 9.8, 10.2, Oracle Linux 9.8 (UEK and RHCK kernels) | dracut                    | `.rpm`                           | ifcfg, NetworkManager     |
| SUSE        | SLES 16.0, openSUSE Leap 15.6 (BIOS, UEFI), SLES 15 SP7 (UEFI)             | dracut                    | `.rpm`                           | NetworkManager, wicked    |
| Arch        | rolling (BIOS)                                                             | mkinitcpio (experimental) | generic `.tgz`                   | systemd-networkd          |
| Windows     | Server 2016, 2019, 2022, 2025                                              | n/a                       | PV drivers 9.x, management agent | captured, reapplied by XO |

Configurations validated across these guests: BIOS and UEFI, Secure Boot off
on the source, SELinux enforcing (relabel), btrfs with snapper, LVM over
three disks with the root LV spanning two, `/boot` and `/usr` each on their
own disk, fstab by UUID, by `dm-uuid` and by
YaST device ID, two NICs with static addresses on both (Linux, and Windows
Server 2022 with `windows-nics`: each address on its VIF, DNS queries seen
on the first one), Windows static address with its DNS reapplied by the
first boot (Server 2019 and 2022), DHCP (Ubuntu 22.04
gets the same address on XCP-ng as on VMware: same MAC, same lease), kdump
enabled.

RHEL itself is not tested (no subscription on the test bench): Rocky Linux
and Oracle Linux (RHCK kernel) share its kernel, dracut, rpm and
NetworkManager; the RHEL subscription is left untouched.

### Partially supported

| Guest                                                                                          | What works                                                                                                                                                                                         | What is missing                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Windows before build 14393: 7 SP1, 8.1 and Server 2012 R2 validated, 2008 R2 expected the same | Offline repair; the VM boots on the emulated IDE disk and the emulated NIC (inbox driver), with the VMware MAC: DHCP and MAC reservations keep working, a static IP is reapplied by the first boot | The XCP-ng 9.x PV drivers do not support these versions (`pv_drivers_unsupported`): by default the first boot installs no package. No PV drivers, no management agent, so no `out/firstboot` in xenstore: the first boot state is only readable offline (`diagnose`, `os.firstboot`) |
| Transactional systems with a read-only root (SL Micro 6.2)                                     | Nothing is written offline. The VM boots on PV devices when its initramfs already has the Xen drivers, which the ISO checks (`initramfs_xen_drivers_present`, true for the generic SL Micro image) | The guest agent and the other offline changes are listed in `readonly_root`, to do after the first boot with `transactional-update`. An initramfs without the Xen drivers is blocking (`readonly_root_initramfs`): rebuild it on the source first                                    |
| Linux with neither systemd nor a package manager supported by the guest tools                  | Initramfs, fstab, VMware tools, network                                                                                                                                                            | No guest agent (`guest_agent_unsupported`): install it after the first boot                                                                                                                                                                                                          |
| Linux without systemd-udevd                                                                    | Initramfs, fstab, VMware tools, agent                                                                                                                                                              | Interface names are not pinned (`linux_interface_names`)                                                                                                                                                                                                                             |
| Linux with a kernel without `xen-blkfront`                                                     | Boots on the emulated IDE disk (`no_xen_blkfront`)                                                                                                                                                 | No PV disk                                                                                                                                                                                                                                                                           |

### Not supported

- Windows before 7 SP1 / 2008 R2 SP1 (`unsupported_windows_version`).
- Encrypted volumes, LUKS and BitLocker: reported, not inspected (later).
- Windows dynamic disks, hibernated Windows or Fast Startup: blocking.
- Windows volume not cleanly shut down (`ntfs_unclean`, blocking): the
  source was powered off, or imported while running and then powered off.
  ntfs-3g only mounts such a volume read-only, so nothing could be written.
  The source must be shut down from the guest (VMware Tools), not powered
  off.
- Anything else (BSD, ...): `no_os_found`.

## What repair does

Detection never modifies anything: it records findings and plans actions,
each with a stable `code`. `repair` applies them in order. Non-critical
actions only produce a warning when they fail.

### All Linux guests

| Action       | Code                        | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initramfs    | `initramfs_xen_drivers`     | Rebuilds it with the guest's own tool in a chroot, with `xen-blkfront`, `xen-netfront` and the emulated IDE drivers. Critical: a PVHVM kernel unplugs the emulated disks at boot whenever it has blkfront support, so without the module in the initramfs the root disk disappears                                                                                                                                                                                                                                                                                                                                                              |
| fstab        | `fstab_stable_names`        | Rewrites `/dev/sdX`, and hardware `by-id` / `by-path` names of the root disk, to `UUID=`. In place (inode and SELinux label kept), backup in `fstab.xo-repair.bak`. Content-derived names (`dm-uuid-`, `lvm-pv-uuid-`, `md-uuid-`) are stable and left alone                                                                                                                                                                                                                                                                                                                                                                                    |
| VMware tools | `disable_vmware_tools`      | Disables the open-vm-tools / vmware-tools units (`vmtoolsd`, `vgauth`, `vgauthd`). Masked units are left alone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Network      | `linux_pin_interface_names` | Interface names change on XCP-ng (`ens192` → `enX0`). For each old name found in the network configuration, writes `/etc/systemd/network/10-xo-repair-<name>.link`, which gives the name back to the NIC with the same MAC, before the initramfs is rebuilt. The guest configuration (ifupdown, ifcfg, NetworkManager, netplan, networkd) then applies unchanged. Automatic with one NIC; with several, XO passes `nics`. Kernel names (`eth0`) do not change. The network configuration itself is never modified: static and DHCP interfaces stay as they are, and a DHCP reservation by MAC keeps working since the VIFs keep the VMware MACs |
| Guest agent  | `install_guest_agent`       | When neither `xe-guest-utilities` nor `xen-guest-agent` is there, installs `xe-guest-utilities` from the [guest tools disk](#guest-tools-disk) and enables `xe-linux-distribution` (not started)                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| kdump        | `kdump_initrd_rebuild`      | Deletes the kdump initrd built on VMware without `xen-blkfront`; kdump rebuilds it on XCP-ng at the next boot. Without this, the capture kernel does not find the disk                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| SELinux      | `selinux_relabel`           | When SELinux is enabled and anything was changed, schedules a relabel (`/.autorelabel`), which may cost one extra reboot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Per family

- **Debian, Ubuntu**: initramfs-tools (`update-initramfs -u -k all`, modules
  appended to `/etc/initramfs-tools/modules`). Agent: the `.deb`, installed
  with `dpkg -i` under a temporary `policy-rc.d` that forbids starting
  services: in a chroot, `invoke-rc.d` would otherwise start the daemon on
  the live system.
- **RHEL family** (RHEL, CentOS, Rocky, Alma...): dracut
  (`--add-drivers`, per kernel). Agent: the `.rpm` (`rpm -U`; the scriptlets
  enable the unit and `systemctl` starts nothing in a chroot), or the
  `legacy` `.rpm` with `chkconfig` when there is no systemd. kdump:
  `/boot/initramfs-*kdump.img`, rebuilt by `kdumpctl`.
- **SUSE** (SLES, openSUSE): dracut. Root on btrfs with snapper: the default
  subvolume is mounted, `subvol=` options of fstab are honoured. fstab by
  device ID (YaST "mount by device ID", older SLES) is rewritten when it
  names the root disk: its entry tells which VMware name is that disk, and
  the partitions follow. kdump: `/var/lib/kdump/initrd`, rebuilt by
  `mkdumprd`. Agent: the `.rpm`.
- **Arch and other systemd guests without dpkg or rpm**: mkinitcpio
  (drop-in `/etc/mkinitcpio.conf.d/90-xo-repair.conf`, `mkinitcpio -P`),
  reported as experimental. Agent: the generic `.tgz`, extracted by the ISO
  following the guest's own links (`/usr/sbin` → `usr/bin`), with the
  systemd unit of the guest tools ISO.
- **Transactional systems** (SL Micro, root on a read-only btrfs snapshot,
  or `/` mounted `ro` in fstab with `transactional-update` present): the root
  is never written offline. Instead of rebuilding the initramfs, the ISO
  lists it (`lsinitramfs`) and checks that `xen-blkfront` and `xen-netfront`
  are in it for every kernel.

### Windows (7 SP1 / 2008 R2 SP1 and later)

Offline, from the ISO, in every control set so that "Last Known Good
Configuration" boots too. The SYSTEM hive is backed up as
`SYSTEM.xo-repair.bak` before being written (`commit_registry`).

| Action          | Code                      | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boot drivers    | `enable_ide_boot`         | `atapi`, `intelide`, `pciide` start at boot, `StartOverride` removed, so Windows boots from the emulated IDE disk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| VMware services | `disable_vmware_services` | Disables them (Start=4), found by name and by rule (image path under `\VMware\VMware Tools\`, or a `vm*` kernel driver described as VMware). Conservative: other VMware/Broadcom products (Carbon Black...) are left alone                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Network         | `clear_old_static_ip`     | Captures the TCP/IP configuration of the old PCI adapters in the report (`network`), then switches the ones with a static address to DHCP; otherwise Windows refuses the same address on the new adapter. Adapters already in DHCP are left untouched. The new PV adapter starts in DHCP with the VMware MAC, so a DHCP reservation by MAC applies to it as before. The static configuration (addresses, masks, gateways, DNS) is written to `\xo-repair\network.ini` for the first boot, keyed by the MAC of the VIF: automatic with a single static adapter on a single NIC, from `windows-nics` otherwise (`windows_static_ip_unmapped` when an adapter has no MAC) |
| First boot      | `install_firstboot`       | Installs the temporary service `XoRepairFirstboot` and `\xo-repair\` (`firstboot.ps1`, `config.ini`), and copies the packages matching `windows-msi-patterns` from the guest tools disk into `\xo-repair\packages\`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Also reported: `os.rtc_timeoffset` (seconds, for `platform:timeoffset`), the
state of a previous first boot (`os.firstboot`,
`windows_firstboot_incomplete` with the end of its log), and
`pv_drivers_unsupported` below build 14393. Below that build, the default
`windows-msi-patterns` is empty: the XCP-ng 9.x MSI would fail and stop the
first boot in its `drivers` phase, before `finish` reapplies the static IP.
Patterns given explicitly by XO are always used.

#### Windows first boot

`firstboot.ps1` runs at each boot as LocalSystem until its phases are done,
then deletes its service. It is compatible with PowerShell 2.0. Before any
phase, it removes the `Run` entries that start a program from
`\VMware\VMware Tools\` ("VMware User Process"), which crashes without its
services.

| Phase     | `standard` | `full` | What it does                                                                                                                                                                                                                                                                         | Ends with       |
| --------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `drivers` | yes        | yes    | installs the packages matching `windows-msi-patterns` from `\xo-repair\packages\` (or a CD drive), in order, then tries the VMware Tools MSI uninstall                                                                                                                               | reboot          |
| `cleanup` |            | yes    | removes VMware driver packages from the driver store (`pnputil -f -d`, provider read from the INF), the VMware Tools directories, and the VMware-signed `vm*.dll` / `vm*.sys` / `pvscsi.sys` from System32                                                                           | reboot          |
| `finish`  | yes        | yes    | applies `network.ini` to the adapters with these MACs (WMI `EnableStatic`, `SetGateways`, `SetDNSServerSearchOrder`). `full` only: removes the ghost VMware PCI devices (vendor 15AD) with `pnputil /remove-device`, on Windows 10 2004 / Server 2022 and later. Then reports `done` | service deleted |

With `windows-reboot=xo`, each reboot of the table is a shut down instead
(`shutdown /s`): XO, which follows the first boot, starts the VM again. It
knows the number of reboots from the cleanup mode (1 in `standard`, 2 in
`full`): before the PV drivers are loaded the guest cannot tell it anything,
so a stopped VM is the signal. Once they are loaded, the script also writes
`<phase>:reboot` before shutting down. The default, `guest`, is for a VM
started by hand: it must never be left stopped in the middle of its first
boot.

A failing phase is retried at the next boot, up to 3 attempts, then the
script gives up (`<phase>:failed`) and deletes its service. The log is in
`\xo-repair\firstboot.log`, next to the MSI installation logs.

`standard` is the default and non-destructive: the VMware components stay
on disk, disabled. `full` follows
[vmwremover](https://github.com/virtio-win/vmwremover), except that vsock is
kept (removing it means editing the Winsock catalog) and devcon.exe is not
used (not redistributable): ghost devices stay where pnputil cannot remove
them, which is harmless since the old static addresses were cleared.

### UEFI (all guests)

The NVRAM on XCP-ng is new, so the boot entries created on VMware are lost.
The ISO does not write NVRAM: it makes sure `\EFI\BOOT\BOOTX64.EFI` exists
on the ESP (`efi_fallback_loader`). For Linux it copies shim, GRUB and
grub.cfg from the vendor directory, like
`grub-install --force-extra-removable`; for Windows, `bootmgfw.efi`.

### Detected but not repaired

- **Interface names that could not be pinned**: several NICs without `nics`,
  or no systemd-udevd (`linux_interface_names`).
- **Unstable device names left**: hardware by-id/by-path names of other
  disks than the root one (`fstab_unstable_names`), `resume=` or `root=` with
  such a name in `/etc/default/grub` (`grub_unstable_resume`,
  `grub_unstable_root`): the initramfs waits for that device at every boot.
- **Firmware mismatches** (Windows on GPT with BIOS, UEFI without ESP).
- **OS not on the first disk** (`boot_disk_not_first`, blocking: nothing is
  modified). XCP-ng boots the first disk, so such a VM does not boot. XO
  moves the VBD of `data.os_disk` to `userdevice` 0 and runs the ISO again.
  Validated with Debian 13 (data disk first, OS on the second disk): it then
  repairs and boots.
- **Encryption, dynamic disks, hibernation**: see
  [not supported](#not-supported).

### Left to the administrator

- **open-vm-tools / VMware Tools** stay installed, disabled (`standard`
  cleanup on Windows). Remove them when convenient.
- **Secure Boot**: off during the ISO runs (the ISO is not signed). XO turns
  it back on after the first boot if the source had it
  (`platform:secureboot=true`, pool certificates installed): validated on
  Ubuntu 22.04, SLES 16.0 and Windows Server 2022.
- **SCC / RHN registrations**: not tested.

## XO side

### Orchestration

1. **Before the migration**: capture from vSphere, while the source VM
   still runs, its NICs (MAC, addresses, prefixes, gateway, DNS from
   `guest.net` and `guest.ipStack`) and its VMX. When the source is stopped
   for the last copy, shut it down from the guest (`ShutdownGuest`, VMware
   Tools) rather than powering it off: a Windows volume left unclean cannot
   be repaired (`ntfs_unclean`).
2. **Create the VM** from the VMX: firmware (BIOS or UEFI), CPU topology
   (`platform:cores-per-socket`), `platform:viridian=true` for Windows, the
   VIFs with their original MACs in order, the disks in order with the boot
   disk at `userdevice` 0. For Windows, `platform:timeoffset` from
   `os.rtc_timeoffset` (needs a diagnose run): Windows keeps the RTC in local
   time and XCP-ng starts it at UTC.
3. **Diagnose** (optional): clear the previous keys, attach the ISO and the
   [guest tools disk](#guest-tools-disk), boot on the ISO in `diagnose` mode
   and show the planned actions and the findings to the user.
4. **Snapshot** the VM, the rollback path. Eject the ISO and detach the
   guest tools disk first: neither SR supports snapshots.
5. **Repair**: attach the ISO and the guest tools disk, clear the previous
   keys, set `mode=repair` (plus `windows-msi-patterns`, `windows-cleanup`,
   `windows-nics`, `nics`). Boot from the CD drive (`HVM-boot-params:order=dc`) with
   `platform:secureboot=false`. Wait for `state=done`, read the report, wait
   for the power off. Check that `tools` is set in the report.
6. **Switch to the disk**: eject the ISO, detach the guest tools disk, set
   the boot order to `c`.
7. **First boot**: Linux boots directly. Windows goes through the first-boot
   phases, rebooting by itself once (`standard`) or twice (`full`); XO
   follows `out/firstboot` until `done`. Before the PV drivers are loaded
   the script cannot report anything: after a timeout, XO stops the VM and
   boots the ISO in `diagnose` mode, which publishes the first boot state.
8. **Network**: nothing to do in the normal case. On Windows the first boot
   reapplies the static configuration of the old adapters, DNS included
   (`network.ini`); with several NICs this needs `windows-nics` in step 5.
   Fallback, for the adapters listed in `windows_static_ip_unmapped` only:
   once the management agent is up, XO reapplies the address and gateway on
   the VIF with the right MAC (`VIF.configure_ipv4` / `VIF.configure_ipv6`,
   no DNS), from the vSphere capture checked against `network`. An adapter
   in DHCP is always left alone: it gets its address, reserved by MAC or
   not. On Linux there is nothing to do:
   the guest keeps its own configuration under its pinned names, and the
   Linux agent does not support `VIF.configure_ipv4` anyway (no
   `control/feature-static-ip-setting`).
9. **Cleanup**: re-enable Secure Boot if the source had it, delete the
   snapshot once the VM is validated.

Details that matter:

- **The ISO** is attached as a CD through a read-only live mount: no ISO SR
  needed, released when its last VBD is gone. XO ejects it whenever a step
  does not need it.
- **`platform:secureboot=false` is mandatory for every UEFI VM** on each
  boot on the ISO, even when XO shows `secureBoot: false`: an absent key
  means `auto` on XCP-ng 8.3. Symptom: the VM lands in the UEFI Shell
  (`Access Denied` on `\EFI\BOOT\BOOTX64.EFI`) and nothing appears in
  xenstore. A signed ISO would remove this.
- **`nics`** is built from the VMX, `ens<ethernetN.pciSlotNumber>=<ethernetN.generatedAddress>`
  for each NIC: the predictable name the guest gave it on VMware
  (`pciSlotNumber` 192 → `ens192`). With it, a migration with several NICs
  needs no manual step.
- **Running repair again** (retry after a failure or a timeout) is safe and
  validated on Rocky 9 and Windows Server 2022: on Linux the agent is not
  reinstalled and fstab and the pinned names stay as they are (the initramfs
  is rebuilt and a relabel scheduled again); on Windows, a first boot that
  already ended in `done` with the PV drivers installed is not scheduled
  again (`windows_firstboot_already_done`). But the old adapters were
  switched to DHCP by the first run, so the second report has no static
  configuration in `network`: XO must keep the `network` of the first
  report.
- **Stale keys**: `VM.xenstore_data` persists after the halt and `vm.set`
  merges keys, so before each boot on the ISO XO must delete (`null`) every
  input it does not set and the whole `out/` subtree. Otherwise it may read
  a `done` from a previous run. The ISO also deletes `out/` when it starts,
  but too late to protect XO.

### Guest tools disk

The ISO takes the XCP-ng guest tools from the guest tools ISO every pool
already has, so the repair ISO stays generic and the tools match the host.

- **VDI**: the guest tools ISO of the pool (`VDI.is_tools_iso = true`, in the
  `XCP-ng Tools` SR); XAPI accepts a VDI of an ISO SR in a disk VBD.
- **VBD**: `type=Disk`, `mode=RO`, `userdevice=25` (`xvdz`),
  `bootable=false`. Not a CD: xen-blkfront ignores CD drives on HVM guests,
  so the live system would not see it.
- **Recognition**: a whole disk with an `iso9660` or `udf` filesystem and a
  `Linux/` or `Windows/` directory. It is never taken as a guest disk.
- **Optional**: without it the report says `"tools": null`, Linux gets
  `guest_agent_missing` and Windows `windows_tools_disk_missing`; the Windows
  first boot then looks for the packages on a CD drive.

### xenstore contract

Paths are relative to the domain (`/local/domain/<domid>/`).

Inputs, set by XO through `VM.xenstore_data` (keys must start with `vm-data/`):

| Key                                      | Values                                                                                                                                                                                                                                                                                                                               | Default                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `vm-data/xo-repair/mode`                 | `diagnose`, `repair`                                                                                                                                                                                                                                                                                                                 | `diagnose`                      |
| `vm-data/xo-repair/windows-msi-patterns` | `;`-separated file patterns of the packages to install, in order (e.g. `xen-*.msi;managementagent-*.msi`)                                                                                                                                                                                                                            | `*.msi`, none below build 14393 |
| `vm-data/xo-repair/windows-cleanup`      | `standard` or `full`, see [Windows first boot](#windows-first-boot)                                                                                                                                                                                                                                                                  | `standard`                      |
| `vm-data/xo-repair/windows-reboot`       | `guest` or `xo`: who restarts the VM between the phases of the first boot, see [Windows first boot](#windows-first-boot)                                                                                                                                                                                                             | `guest`                         |
| `vm-data/xo-repair/nics`                 | Linux, `;`-separated `<old name>=<MAC>` (e.g. `ens192=00:0c:29:d4:bf:19;ens224=00:0c:29:d4:bf:23`). Only needed with several NICs                                                                                                                                                                                                    | unset                           |
| `vm-data/xo-repair/windows-nics`         | Windows, `;`-separated `<MAC>=<GUID>`: the VIF that gets the static configuration of the old adapter with this `guid` in `network` (e.g. `00:0c:29:94:80:0d={44FED271-EE81-4363-8CF0-893542F0734F}`). XO builds it by matching the addresses of its vSphere capture with the report of a diagnose run. Only needed with several NICs | unset                           |
| `vm-data/xo-repair/keep-running`         | `1` to stay up after the run (debugging)                                                                                                                                                                                                                                                                                             | unset                           |

Outputs, written by the ISO under `vm-data/` too: XAPI syncs the guest's
`vm-data/` subtree back into `VM.xenstore_data`, but not `data/`.

| Key                               | Content                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vm-data/xo-repair/out/version`   | ISO version (`YYYYMMDD-<sha>` or the release tag)                                                                                                                                                                                                                                                      |
| `vm-data/xo-repair/out/mode`      | mode actually used                                                                                                                                                                                                                                                                                     |
| `vm-data/xo-repair/out/state`     | `running`, then `done` (written last: the other keys are final)                                                                                                                                                                                                                                        |
| `vm-data/xo-repair/out/result`    | `ok`, `warning` or `error`                                                                                                                                                                                                                                                                             |
| `vm-data/xo-repair/out/report`    | compact JSON report, written raw (`xenstore-write -R`)                                                                                                                                                                                                                                                 |
| `vm-data/xo-repair/out/firstboot` | Windows, written by the first-boot script once the PV drivers are loaded: `<phase>:running`, `<phase>:reboot` (`windows-reboot=xo`, the VM shuts down), `<phase>:error`, `<phase>:failed` or `done`. A later `diagnose` run reads it offline and writes it too (`<phase>:pending` if it never started) |

oxenstored refuses guest values over 2048 bytes (`quota-maxsize`), so the
compact report is limited to 1900 bytes: info-level findings, messages and
details are dropped first, the `code` of each finding and action and the
`network` list are always kept. In repair mode the full report and the log
are also written into the guest: `/var/log/xo-repair/` on Linux,
`\xo-repair\` on Windows.

```json
{
  "version": "20261012-1a2b3c4d",
  "mode": "diagnose",
  "result": "warning",
  "firmware": "uefi",
  "disks": ["xvda", "xvdb"],
  "tools": "xvdz",
  "os": {
    "kind": "linux",
    "name": "Debian GNU/Linux 12 (bookworm)",
    "id": "debian",
    "version": "12",
    "root": "/dev/xvda2",
    "kernels": ["6.1.0-18-amd64"],
    "initramfs": "initramfs-tools",
    "guest_agent": "xe-guest-utilities_7.30.0-19_amd64.deb"
  },
  "network": [],
  "findings": [
    { "level": "warning", "code": "linux_interface_names", "message": "...", "data": { "interfaces": ["ens192"] } }
  ],
  "actions": [{ "code": "initramfs_xen_drivers", "status": "planned", "description": "..." }]
}
```

For Windows, `network` lists the TCP/IP configuration of the old adapters
(`adapter`, `vmware`, `dhcp`, `addresses`, `masks`, `gateways`, `dns`).

### Left to implement in XO

- Capture of the vSphere network configuration (step 1) and VM creation
  from the VMX (step 2), including `nics` from `ethernetN.pciSlotNumber`.
- `windows-nics` for Windows VMs with several NICs: match the addresses of
  the vSphere capture (MAC → addresses) with `network` of a diagnose report
  (GUID → addresses). It relies on the network mapping given by the user.
- The sequence of steps 3 to 9: live mount of the ISO, guest tools disk VBD,
  cleaning of the xenstore keys, `platform:secureboot=false`, report reading,
  first-boot follow-up with its timeout and diagnose fallback.
- The step 8 fallback (`VIF.configure_ipv4`, validated on Windows Server 2019
  with agent 9.2.385: address and gateway applied within seconds, no DNS),
  for the adapters left in `windows_static_ip_unmapped`.
- Windows below build 14393: no supported source of PV drivers. XO should
  warn before the migration that the VM will run on emulated devices, and
  not wait for `out/firstboot` after the first boot: without PV drivers the
  guest cannot write to xenstore. Check it offline with a `diagnose` run if
  needed (`os.firstboot`).
- Windows patches (`.msp`): `firstboot.ps1` runs `msiexec /i` on every
  package. Not needed with the current tools ISO (its
  `XenTools-fix-9.2.351.msp` targets 9.2.351, the MSI installs 9.2.385). If
  a future one needs it: `/p` by extension, after its MSI, 1642 (not
  applicable) as skipped.
- When a migration does not end well, point the user to the files below
  (see [investigating a migrated VM](#investigating-a-migrated-vm)).

### Investigating a migrated VM

The report in xenstore is short on purpose (codes always, details when they
fit) and drives the automation. The details stay in the VM: `repair` writes
the full report and the full log of the ISO into the guest, next to what the
first boot produces. They are where the user investigates, and where XO
points them when a migration does not end well.

| Guest   | Files                                                                                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux   | `/var/log/xo-repair/report.json`, `/var/log/xo-repair/xo-repair.log`; backups next to the changed files (`/etc/fstab.xo-repair.bak`, `/etc/initramfs-tools/modules.xo-repair.bak`)                                |
| Windows | `C:\xo-repair\report.json`, `xo-repair.log` (ISO), `firstboot.log` (first boot, each phase and the static IP configuration), `install-*.log` (MSI), `network.ini`; `SYSTEM.xo-repair.bak` next to the SYSTEM hive |

When the guest does not boot, these files are reached by booting the ISO
with `keep-running` (the console logs in automatically, the guest disks can
be mounted from there), or by attaching the disk to another VM. A
`diagnose` run writes nothing to the guest, but it reads the state of a
Windows first boot offline and reports it (`os.firstboot`, with the end of
`firstboot.log` when the report has room for it).

## Modes

**`diagnose`** is the default. It only reads: filesystems are mounted
read-only without journal replay (`noload`, `norecovery`,
`rescue=nologreplay`), and actions are reported as `planned`, which shows
exactly what `repair` would do.

**`repair`** applies the planned actions in order, unless a blocking error
was found, in which case nothing is modified. A failing critical action
stops the run and the following actions are reported as `skipped`.

## Layout

```
auto/config                      live-build options (Debian trixie, BIOS + UEFI hybrid ISO)
config/package-lists/            packages of the live system
config/hooks/normal/             enable the service; zero boot menu timeouts; boot menu titles
config/bootloaders/splash.svg    boot menu background (logo embedded in base64), 640x480 for
                                 isolinux, scaled to 800x600 for grub
config/includes.chroot/          files copied into the live system
  etc/systemd/system/xo-repair.service
  usr/local/bin/xo-repair
  usr/lib/xo-repair/xo_repair/   the repair tool (Python stdlib + python3-hivex)
scripts/check-iso.sh             post-build checks on the ISO
tests/                           unit tests (python3 -m unittest)
```

The tool depends only on Debian packages: no pip, no lockfile. Security
updates come from rebuilding the ISO, which CI does every week.

## Build

On Debian trixie, as root:

```sh
apt-get install live-build
scripts/build.sh               # produces dist/xo-repair-<version>.iso and its .sha256
lb clean                       # auto/clean also removes generated config files
```

`scripts/build.sh` writes the version (`YYYYMMDD-<sha>`, with `-dirty` if
tracked files are modified, or `$XO_REPAIR_VERSION`) into the ISO, then runs
`lb config`, `lb build` and `scripts/check-iso.sh`.

CI (`.github/workflows/build.yml`) runs on GitHub Actions and Gitea Actions.
It runs the unit tests, builds the ISO in a privileged `debian:trixie`
container, checks it, and publishes it with its SHA-256 as an artifact. It
runs on every push, on `v*` tags, and once a week. On Gitea, the act_runner
must allow privileged containers.

## Development

```sh
python3 -m unittest discover -s tests -v    # needs python3-hivex for the registry tests
```

The tool can also be run by hand from the live system, or from any Linux
system with the guest disks attached. Without `--service` it never powers off:

```sh
xo-repair --mode diagnose --verbose
cat /run/xo-repair/report.json /run/xo-repair/xo-repair.log
```

Kernel command line switches, for testing without XO: `xo-repair.mode=repair`,
`xo-repair.keep-running`, and `xo-repair.disable`, which skips the service.
With `keep-running`, the console logs in automatically as the live user
(`user`, with `sudo`).

## License

AGPL-3.0-only, see `LICENSE`.
