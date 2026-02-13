import { WinRM } from 'winrm-js';

interface HyperVDisk {
  id: string;
  name: string;
  virtualSize: number;
  path: string;
}

interface HyperVNetwork {
  id: string;
  label: string;
  macAddress: string;
  isStatic: boolean;
  ipAddresses: string[];
}

interface VMMetadata {
  id: string;
  name: string;
  cpuCount: number;
  memoryMB: number;
  disks: HyperVDisk[];
  networks: HyperVNetwork[];
}

class HyperVManager {
  private client: any;

  constructor(host: string, user: string, pass: string) {
    this.client = new WinRM({
      host,
      user,
      pass,
      port: 5985,
      ssl: false
    });
  }

  /**
   * List basic VM info
   */
  async listVMs(): Promise<{ id: string; name: string }[]> {
    const script = `
      Get-VM | Select-Object @{n='id';e={$_.Id.ToString()}}, Name | ConvertTo-Json
    `;
    const result = await this.runPowerShell(script);
    return JSON.parse(result);
  }

  /**
   * Get detailed metadata for a specific VM
   */
  async getVMMetadata(vmId: string): Promise<VMMetadata> {
    const script = `
      $vm = Get-VM -Id "${vmId}"
      $hardDrives = Get-VMHardDiskDrive -VMId $vm.Id
      $adapters = Get-VMNetworkAdapter -VMId $vm.Id

      $metadata = @{
          id = $vm.Id.ToString()
          name = $vm.Name
          cpuCount = $vm.ProcessorCount
          memoryMB = $vm.MemoryAssigned / 1MB
          disks = $hardDrives | ForEach-Object {
              $vhd = Get-VHD -Path $_.Path
              @{
                  id = $_.ControllerLocation.ToString()
                  name = $_.Name
                  virtualSize = $vhd.Size
                  path = $_.Path
              }
          }
          networks = $adapters | ForEach-Object {
              @{
                  id = $_.Id
                  label = $_.Name
                  macAddress = $_.MacAddress
                  # IP info requires Integration Services to be running
                  ipAddresses = $_.IPAddresses
                  isStatic = if ($_.AddressType -eq 'Static') { $true } else { $false }
              }
          }
      }
      $metadata | ConvertTo-Json -Depth 5
    `;

    const result = await this.runPowerShell(script);
    return JSON.parse(result);
  }

  private async runPowerShell(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.sendCommand(command, (err: any, output: string) => {
        if (err) return reject(err);
        resolve(output);
      });
    });
  }
}

// Example Usage:
/*
(async () => {
    const hv = new HyperVManager('192.168.1.10', 'Administrator', 'Password123');
    const vms = await hv.listVMs();
    console.log('VM List:', vms);

    if (vms.length > 0) {
        const details = await hv.getVMMetadata(vms[0].id);
        console.log('Detailed Metadata:', JSON.stringify(details, null, 2));
    }
})();
*/

/*
By default, Windows blocks remote access to administrative shares (C$) for local (non-domain) accounts, even if they are administrators. This is due to Remote UAC.

If your Hyper-V host is not in an Active Directory domain, you must run this PowerShell command on the Hyper-V host once to allow your Node.js tool to connect:

# Run as Administrator on the Hyper-V Host
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" `
-Name "LocalAccountTokenFilterPolicy" -Value 1 -PropertyType DWORD -Force


import SMB2 from 'smb2';

const smbClient = new SMB2({
  share: '\\\\192.168.1.10\\C$',
  domain: 'WORKGROUP',
  username: 'Administrator',
  password: 'YourPassword'
});

// Read the VHDX as a stream
const stream = smbClient.createReadStream('VMs\\Disk1.vhdx');

*/