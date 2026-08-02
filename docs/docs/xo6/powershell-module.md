# PowerShell module

## Introduction

Xen Orchestra (XO) is a powerful tool for managing XCP-ng and XenServer virtualization environments. However, relying solely on the web interface can result in repetitive manual tasks. For system administrators, particularly those working in Windows-centric environments, **PowerShell** is the go-to automation tool. The [`xo-powershell`](https://github.com/vatesfr/xo-powershell) module combines the strengths of these two tools by offering PowerShell's scripting capabilities to interact directly with the Xen Orchestra API.

## What the module provides

The module covers the whole infrastructure, not just VMs:

| Area           | Cmdlets (examples)                                                       |
| :------------- | :----------------------------------------------------------------------- |
| Session        | `Connect-XoSession`, `Test-XoSession`, `Disconnect-XoSession`            |
| VM lifecycle   | `Get-XoVm`, `Start-XoVm`, `Stop-XoVm`, `Restart-XoVm`, `Suspend-XoVm`    |
| Snapshots      | `New-XoVmSnapshot`, `Get-XoVmSnapshot`                                   |
| Storage        | `Get-XoSr`, `Get-XoVdi`, `Get-XoVmVdi`, `Get-XoVdiSnapshot`              |
| Disk export    | `Export-XoVdi`, `Export-XoVdiSnapshot` (to VHD or raw)                   |
| Infrastructure | `Get-XoServer`, `Get-XoHost`                                             |
| Tasks          | `Get-XoTask`, `Wait-XoTask`                                              |

For the full, current cmdlet reference, see the [xo-powershell GitHub repository](https://github.com/vatesfr/xo-powershell): it is the source of truth for the module's capabilities and options.

## Installation and connection {#single-line-installation-and-connection}

The `xo-powershell` module is installed from the [PowerShell Gallery](https://www.powershellgallery.com/packages/xo-powershell/) in a single command:

<Terminal shell title="install from the PowerShell Gallery">{`
Install-Module -Name xo-powershell -AllowPrerelease
`}</Terminal>

:::note Prerequisites
PowerShell **7.0 or later**, on Windows, Linux or macOS. Windows PowerShell 5.1 is not supported. The module is currently published as a prerelease (`1.0.0-beta`), hence the `-AllowPrerelease` flag (or `Install-PSResource -Name xo-powershell -Prerelease` with PSResourceGet).
:::

Connecting to your Xen Orchestra instance is just as straightforward, requiring only the host address and an API token:

<Terminal shell title="connect to your XO instance">{`
Connect-XoSession -HostName "https://your-xo-server" -Token "your-api-token"
`}</Terminal>

:::tip Obtaining the API token
In Xen Orchestra, go to your user page and generate an authentication token. See [REST API authentication](../xo5/restapi.md#authentication) for details.
:::

## Pipeline-driven automation {#the-power-of-the-pipeline-for-advanced-automation}

What distinguishes this module from a simple API wrapper is its deep integration with the PowerShell pipeline. Most commands are designed to pass objects to one another, allowing the creation of single-line commands that are both powerful and expressive.

### Simple usage examples {#example-simple-usage-examples}

<Terminal shell title="query your infrastructure">{`
# List XCP-ng servers
Get-XoServer
# Monitor ongoing tasks
Get-XoTask
# Get information about virtual disks
Get-XoVdi
`}</Terminal>

<UiDetail src="/img/xo6/powershell-servers.png" alt="Get-XoServer returns your connected XCP-ng servers as PowerShell objects" width={720} />

To stop all virtual machines whose name contains `Test`, one line suffices:

<Terminal shell title="filter and act through the pipeline">{`
Get-XoVm | Where-Object { $_.Name -like "*Test*" } | Stop-XoVm
`}</Terminal>

This command first retrieves the list of all VMs, filters it to keep only those whose name matches the criteria, and then passes only these VMs to `Stop-XoVm`. This is possible because `Get-XoVm` does not return text but a collection of PowerShell objects: each VM object has properties (`.Name`, `.Memory`, etc.) that can be inspected by `Where-Object` before the complete object is passed to the next command.

The same principle applies to more complex filtering, such as suspending running VMs with more than 4 GB of memory:

<Terminal shell title="suspend running VMs with more than 4 GB of RAM">{`
Get-XoVm -PowerState Running | Where-Object { $_.Memory.size -gt 4294967296 } | Suspend-XoVm
`}</Terminal>

:::tip
This capability transforms script writing, moving from a series of disconnected commands to a fluid flow of data and actions.
:::

## Beyond VM management {#extended-environment-control-vm-management}

Some practical combinations:

| Scenario                 | Command sequence                                        | Benefit                              |
| :----------------------- | :------------------------------------------------------ | :----------------------------------- |
| **Storage audit**        | `Get-XoSr` → `Get-XoVdi` → `Get-XoVmVdi`                | Comprehensive storage utilization view |
| **Maintenance planning** | `Get-XoHost` → `Get-XoVm` → `Stop-XoVm` → `Wait-XoTask` | Planned maintenance without data loss |
| **Session verification** | `Test-XoSession`                                        | Verify automation readiness          |

`Wait-XoTask` deserves a mention: it enables robust scripts that wait for lengthy operations (such as creating a **snapshot**) to complete before continuing execution. This makes the module a true command-line interface for Xen Orchestra and not just a tool for a few common tasks.

### Example: Creating virtual machine snapshots

This demonstration shows how to create and verify a virtual machine snapshot.

**Step 1: identify a base VM.**

<Terminal shell title="list VMs with their UUID and power state">{`
Get-XoVm | Format-Table Name, Uuid, PowerState
`}</Terminal>

<UiDetail src="/img/xo6/powershell-install-vms.png" alt="Installing the module, then listing VMs with Get-XoVm | Format-Table" width={720} />

**Step 2: create a snapshot.**

<Terminal shell title="snapshot a VM by UUID">{`
New-XoVmSnapshot -VmUuid "993d84c2-2571-8451-8073-afa8ef510a8d" -SnapshotName "your-snapshot-name"
`}</Terminal>

<UiDetail src="/img/xo6/powershell-snapshot-new.png" alt="New-XoVmSnapshot returns the created snapshot object" width={720} />

**Step 3: verify the snapshot creation.**

<Terminal shell title="find the snapshot by name">{`
Get-XoVmSnapshot -Filter "name_label:your-snapshot-name"
`}</Terminal>

<UiDetail src="/img/xo6/powershell-snapshot-verify.png" alt="Get-XoVmSnapshot confirms the snapshot exists" width={720} />

The snapshot also shows up in the Xen Orchestra web interface:

<UiShot light="/img/xo6/powershell-snapshot-xo.png" alt="The snapshot created from PowerShell, visible in the VM's Snapshots tab" url="https://your-xo/v5/#/vms/…/snapshots" />

## Conclusion: Rethink your XCP-ng management {#conclusion-rethink-your-xcp-ng-management}

The `xo-powershell` module is much more than just a collection of commands: it is a gateway to powerful, scalable and efficient automation within the XCP-ng/Xen Orchestra ecosystem. Leveraging the PowerShell pipeline and a comprehensive set of commands aligns it with the DevOps philosophy, bringing automation practices closer to Windows administrators and helping them save valuable time while reducing the risk of human error.

## Related links

- [xo-powershell on GitHub](https://github.com/vatesfr/xo-powershell) (source of truth for cmdlets and options)
- [xo-powershell on the PowerShell Gallery](https://www.powershellgallery.com/packages/xo-powershell/)
- [Infrastructure as Code category on the XCP-ng forum](https://xcp-ng.org/forum/category/29/infrastructure-as-code)
- [REST API authentication](../xo5/restapi.md#authentication)
