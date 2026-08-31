# Backup proxies

A Xen Orchestra proxy is a small appliance you deploy in your infrastructure to handle the data streams of your backup jobs locally, while your main Xen Orchestra appliance (XOA) keeps orchestrating everything. The two most common reasons to use a proxy are:

- **Large infrastructure**: spread the backup workload across several appliances and avoid saturating the main XOA
- **Remote sites**: keep backup data inside the remote site and avoid a useless round trip across the WAN to the main XOA

## Architecture

Without a proxy, the main XOA handles every data stream itself. For a remote site, that means the VM export travels all the way to the main XOA, only to be sent right back to a backup repository (BR) sitting next to the pool it came from. With a proxy deployed on the remote site, the data never leaves the site: the proxy exports the VMs and writes to the local BR, and only lightweight control traffic crosses the WAN.

<Schema label="Without a proxy, backup data from a remote pool crosses the WAN twice to reach a BR located on the same remote site; with a proxy deployed there, the data stays local and only control traffic crosses the WAN" legend={[["#6aabf0", "XOA / XO Proxy"], ["#8e83fe", "XCP-ng pool"], ["#5ac8c8", "backup data"], ["#e0a94a", "backup repository (BR)"]]} maxWidth="640px">
<svg viewBox="0 0 640 476" role="img" aria-label="Two panels compare backup traffic. Without a proxy, the VM export from the remote XCP-ng pool crosses the WAN to the main XOA, which sends the backup data back across the WAN to the backup repository on the remote site: the same data crosses the WAN twice. With a proxy deployed on the remote site, backup data flows locally from the pool through the XO Proxy to the backup repository, and only control traffic crosses the WAN between XOA and the proxy">
  <text x="16" y="28" fill="#c6d2e1" fontSize="12.5">Without a proxy</text>
  <rect x="16" y="44" width="170" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="28" y="64" fill="#c6d2e1" fontSize="12">Main site</text>
  <rect x="44" y="96" width="112" height="64" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="100" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">XOA</text>
  <text x="100" y="140" fill="#7a8699" fontSize="10" textAnchor="middle">main appliance</text>
  <text x="243" y="64" fill="#7a8699" fontSize="11" textAnchor="middle">WAN</text>
  <rect x="300" y="44" width="324" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="312" y="64" fill="#c6d2e1" fontSize="12">Remote site</text>
  <rect x="316" y="84" width="108" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" />
  <text x="370" y="108" fill="#c6d2e1" fontSize="11" textAnchor="middle">XCP-ng pool</text>
  <rect x="492" y="124" width="116" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="550" y="143" fill="#c6d2e1" fontSize="12" textAnchor="middle">BR</text>
  <text x="550" y="157" fill="#7a8699" fontSize="9" textAnchor="middle">backup repository</text>
  <line x1="316" y1="104" x2="166" y2="104" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="156,104 166,99 166,109" fill="#5ac8c8" />
  <text x="243" y="96" fill="#5ac8c8" fontSize="10" textAnchor="middle">1. VM export</text>
  <line x1="156" y1="144" x2="482" y2="144" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="492,144 482,139 482,149" fill="#5ac8c8" />
  <text x="243" y="160" fill="#5ac8c8" fontSize="10" textAnchor="middle">2. backup data</text>
  <text x="320" y="232" fill="#ef6a5f" fontSize="10.5" textAnchor="middle">the same backup data crosses the WAN twice</text>
  <line x1="16" y1="250" x2="624" y2="250" stroke="rgba(255,255,255,0.12)" />
  <text x="16" y="278" fill="#c6d2e1" fontSize="12.5">With a proxy</text>
  <rect x="16" y="294" width="170" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="28" y="314" fill="#c6d2e1" fontSize="12">Main site</text>
  <rect x="44" y="330" width="112" height="56" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="100" y="354" fill="#c6d2e1" fontSize="12" textAnchor="middle">XOA</text>
  <text x="100" y="370" fill="#7a8699" fontSize="10" textAnchor="middle">main appliance</text>
  <text x="243" y="314" fill="#7a8699" fontSize="11" textAnchor="middle">WAN</text>
  <line x1="156" y1="351" x2="482" y2="404" stroke="#7a8699" strokeDasharray="3 4" />
  <text x="243" y="352" fill="#7a8699" fontSize="9.5" textAnchor="middle">control traffic only</text>
  <rect x="300" y="294" width="324" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="312" y="314" fill="#c6d2e1" fontSize="12">Remote site</text>
  <rect x="316" y="400" width="104" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" />
  <text x="368" y="424" fill="#c6d2e1" fontSize="10.5" textAnchor="middle">XCP-ng pool</text>
  <rect x="444" y="404" width="76" height="32" rx="6" fill="rgba(106,171,240,0.10)" stroke="#6aabf0" />
  <text x="482" y="424" fill="#c6d2e1" fontSize="10.5" textAnchor="middle">XO Proxy</text>
  <rect x="544" y="400" width="64" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="576" y="424" fill="#c6d2e1" fontSize="12" textAnchor="middle">BR</text>
  <line x1="420" y1="420" x2="434" y2="420" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="444,420 435,415.5 435,424.5" fill="#5ac8c8" />
  <line x1="520" y1="420" x2="534" y2="420" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="544,420 535,415.5 535,424.5" fill="#5ac8c8" />
  <text x="462" y="456" fill="#5ac8c8" fontSize="10" textAnchor="middle">backup data stays on the remote site</text>
</svg>
</Schema>

## Deployment

### Prerequisites

Each deployed proxy needs its own proxy license: see [Pricing and available add-ons](https://docs.vates.tech/pricing-licencing/pricing-addons/) in the Vates docs. If you have an unused license on your account, it will be bound automatically to the proxy at deployment time.

### Minimum Requirements

XO proxies require the following resources:

- 2 vCPUs
- 2 GiB RAM
- 20 GiB disk (2 GiB on a thin provisioned SR)

### Installation

1. Go to the **Proxies** section of your appliance:

<UiDetail src="/img/xo5/proxy-section.png" alt="The Proxies entry in the XOA main menu" width={175} />

2. Click **Deploy a proxy**:

<UiDetail src="/img/xo5/proxy-deploy-form.png" alt="The Deploy a proxy button in the Proxies view, with no proxies deployed yet" width={291} />

3. Choose where the proxy VM will live: destination SR, destination network and network configuration (DHCP or static):

<UiDetail src="/img/xo5/proxy-first-config.png" alt="The Deploy a proxy modal asking for a destination SR, a destination network and the network configuration" width={602} />

4. If you have an available license, it will be automatically bound to your newly deployed proxy.

## Backup repository through a proxy {#proxy-remote-creation}

Once a proxy is deployed in your infrastructure, you can create a backup repository (BR) handled by that proxy, using the usual form (still labeled _Remotes_ in XO 5). Simply pick the proxy in the **Proxy** selector: the proxy will mount the BR itself and handle all data streams to it.

<UiDetail src="/img/xo5/proxy-remote-form.png" alt="The New file system remote form with an NFS type and Proxy 1 selected in the proxy field" width={700} />

The proxy handling each BR is then visible in the _Remotes_ list:

<UiDetail src="/img/xo5/proxy-remote-select.png" alt="The Remotes list showing an enabled BR with Proxy 1 displayed in its Proxy column" width={700} />

## Backup job with Proxies

While creating a standard backup job from your main Xen Orchestra appliance, you can select a proxy in the job settings: the proxy will then execute the job and handle its data streams instead of the main appliance.

<UiDetail src="/img/xo5/proxy-job-select.png" alt="The backup job Settings panel with Proxy 1 selected in the Proxy field" width={700} />

:::tip
If you see this error: `The backup will not be run on this remote because it's not compatible with the selected proxy`, it means the selected BR is not handled by the proxy chosen for the job. A proxy can only write to BRs that are bound to it, so either bind that BR to the same proxy, or pick a BR that already is.

<UiDetail src="/img/xo5/remote_not_compatible_with_proxy.png" alt="A backup job form showing the error tooltip: the backup will not be run on this remote because it's not compatible with the selected proxy" width={700} />
:::

## Enabling login to a proxy appliance

Login is disabled by default on proxy appliances.
If you need to login for some reason, you need to set a password for the `xoa` user via the XenStore of the VM. Run the following on your XCP-ng host, where `UUID` is the UUID of your proxy VM:

<Terminal shell title="XCP-ng host: set a password for the xoa user">{`
xe vm-param-set uuid=<UUID> xenstore-data:vm-data/system-account-xoa-password=<password>
`}</Terminal>

Then restart the proxy VM.
You can now login through SSH with the `xoa` username and the password you defined in the previous command.

## Adding a network card to a Proxy

First you will need to add a second VIF to your proxy VM. This can be done in the Network tab of the VM in XOA.

After adding the VIF, you will need to set an IP address for the new NIC. To do so, SSH to the VM [as described before](#enabling-login-to-a-proxy-appliance).

If you want a static address:

<Terminal title="proxy VM: set a static IP on eth1">{`
xoa network static eth1
? Static IP for this machine 192.168.100.120
? Network mask (eg 255.255.255.0) 255.255.255.0
`}</Terminal>

If you prefer using DHCP:

<Terminal shell title="proxy VM: configure eth1 through DHCP">{`
xoa network dhcp eth1
`}</Terminal>

:::tip
As XOA uses the first IP address reported by XAPI to contact the proxy appliance, you may have to switch the network card order if you want your proxy to be connected through a specific IP address.
:::
