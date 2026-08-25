# Architecture

Xen Orchestra (XO) is built as **one server and several clients**: the two web interfaces ([XO 6](xo6/gettingstarted.md) and XO 5), the command line client `xo-cli`, and anything speaking the [REST API](automation/restapi.md). The server, `xo-server`, is the only piece that talks to your infrastructure.

:::tip
XO is totally agent-less: nothing to install on your hosts. `xo-server` speaks XAPI, the native toolstack of XCP-ng, directly over the network.
:::

<Schema label="One server, several clients, your whole infrastructure" legend={[["#6aabf0", "XO"], ["#8e83fe", "XCP-ng"]]} maxWidth="720px">
<svg viewBox="0 0 680 330" role="img" aria-label="XO 6, XO 5, xo-cli and REST API clients talk to xo-server, which connects to the master of every XCP-ng pool over XAPI">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="12" width="150" height="52" rx="8"/>
    <rect x="190" y="12" width="150" height="52" rx="8"/>
    <rect x="360" y="12" width="140" height="52" rx="8"/>
    <rect x="520" y="12" width="140" height="52" rx="8"/>
  </g>
  <g fontSize="12.5" fill="#c6d2e1" textAnchor="middle">
    <text x="95" y="34">XO 6</text>
    <text x="265" y="34">XO 5</text>
    <text x="430" y="34">xo-cli</text>
    <text x="590" y="34">REST API</text>
  </g>
  <g fontSize="10" fill="#7a8699" textAnchor="middle">
    <text x="95" y="52">web UI · Vue.js</text>
    <text x="265" y="52">web UI · React</text>
    <text x="430" y="52">command line</text>
    <text x="590" y="52">automation</text>
  </g>
  <g className="schema-flow" stroke="#7a8699" strokeWidth="1.4" strokeDasharray="5 4">
    <line x1="95" y1="64" x2="250" y2="120"/>
    <line x1="265" y1="64" x2="300" y2="120"/>
    <line x1="430" y1="64" x2="380" y2="120"/>
    <line x1="590" y1="64" x2="430" y2="120"/>
  </g>
  <rect x="190" y="120" width="300" height="60" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="340" y="145" fontSize="15" fill="#6aabf0" textAnchor="middle">xo-server</text>
  <text x="340" y="164" fontSize="10.5" fill="#7a8699" textAnchor="middle">Node.js daemon · events · cache · proxy</text>
  <g className="schema-flow" stroke="#6aabf0" strokeWidth="1.6" strokeDasharray="5 4">
    <line x1="270" y1="180" x2="170" y2="230"/>
    <line x1="410" y1="180" x2="510" y2="230"/>
  </g>
  <line className="schema-flow" x1="340" y1="180" x2="340" y2="230" stroke="#6aabf0" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="5 4"/>
  <text x="272" y="212" fontSize="9.5" fill="#7a8699">XAPI</text>
  <rect x="328" y="230" width="24" height="88" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
  <text x="340" y="280" fontSize="16" fill="#7a8699" textAnchor="middle">…</text>
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="20" y="230" width="300" height="88" rx="10"/>
    <rect x="360" y="230" width="300" height="88" rx="10"/>
  </g>
  <text x="36" y="252" fontSize="12.5" fill="#7a8699">Pool 1</text>
  <text x="376" y="252" fontSize="12.5" fill="#7a8699">Pool 12</text>
  <g fill="rgba(142,131,254,0.14)" stroke="#8e83fe" strokeOpacity="0.85">
    <rect x="36" y="264" width="120" height="40" rx="5"/>
    <rect x="376" y="264" width="120" height="40" rx="5"/>
  </g>
  <g fill="rgba(142,131,254,0.08)" stroke="#8e83fe" strokeOpacity="0.4">
    <rect x="168" y="264" width="64" height="40" rx="5"/>
    <rect x="240" y="264" width="64" height="40" rx="5"/>
    <rect x="508" y="264" width="64" height="40" rx="5"/>
    <rect x="580" y="264" width="64" height="40" rx="5"/>
  </g>
  <g fontSize="11.5" fill="#8e83fe" textAnchor="middle">
    <text x="96" y="282">pool master</text>
    <text x="436" y="282">pool master</text>
  </g>
  <g fontSize="10" fill="#8e83fe" fillOpacity="0.6" textAnchor="middle">
    <text x="200" y="282">host</text>
    <text x="272" y="282">host</text>
    <text x="540" y="282">host</text>
    <text x="612" y="282">host</text>
  </g>
  <g fontSize="9.5" fill="#7a8699" textAnchor="middle">
    <text x="96" y="297">XCP-ng</text>
    <text x="436" y="297">XCP-ng</text>
  </g>
  <g fontSize="9" fill="#7a8699" fillOpacity="0.7" textAnchor="middle">
    <text x="200" y="297">XCP-ng</text>
    <text x="272" y="297">XCP-ng</text>
    <text x="540" y="297">XCP-ng</text>
    <text x="612" y="297">XCP-ng</text>
  </g>
</svg>
</Schema>

Note that `xo-server` only needs to reach the **master** of each pool: the master relays to the other hosts of its pool. One XO connects to any number of pools, on any site.

## XOA

The _Xen Orchestra Appliance_ (XOA) is a VM with the whole stack pre-installed, configured and QA validated. It is the way we recommend and support running XO: see [Installing XOA](installation.md).

## xo-server

[`xo-server`](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-server/) is the heart of Xen Orchestra: a Node.js daemon connected permanently to your pools. Its central position is what makes XO more than a mere client:

- **Always on**: as a daemon, it listens to and records every event of your infrastructure, around the clock, whether a client is watching or not. That is what makes always-up-to-date views, scheduled backup jobs and task history possible.
- **Event driven**: `xo-server` subscribes to XAPI events instead of polling. Changes on a host or VM appear in your browser the moment they happen, and the server-side cache answers clients instantly, at any infrastructure size.
- **A single connection point**: clients connect to `xo-server`, never to your hosts. Legacy thick clients opened connections from every admin workstation to every server; here one daemon holds one connection per pool, and any number of clients share it.
- **A proxy for your hosts**: because everything flows through it, `xo-server` can expose VM consoles to clients that have no network access to the hosts, or stream a VM export from one pool straight into another (that is [warm migration](xo5/manage_infrastructure.md) territory) without a file stop in between.
- **Pluggable**: features like LDAP authentication, load balancing, netbox synchronization or backup reports are [plugins](#plugins), not core patches.

### Events, not polling

Legacy clients ask the servers "anything new?" every few seconds: slow, and it collapses at scale. `xo-server` subscribes once to the XAPI event stream, and pushes every change to all connected clients the moment it happens:

<Schema label="Polling asks, events arrive" legend={[["#6aabf0", "XO"], ["#8e83fe", "XCP-ng"]]} maxWidth="680px">
<svg viewBox="0 0 680 230" role="img" aria-label="Legacy polling asks the host for news every few seconds; with Xen Orchestra, XAPI events flow from the host through xo-server to every client the moment they happen">
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="20" y="14" width="290" height="200" rx="10"/>
    <rect x="370" y="14" width="290" height="200" rx="10"/>
  </g>
  <text x="36" y="38" fontSize="12" fill="#7a8699">polling · legacy clients</text>
  <text x="386" y="38" fontSize="12" fill="#7a8699">events · Xen Orchestra</text>
  {/* Polling side: client asks, waits, asks again. */}
  <rect x="95" y="52" width="140" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)"/>
  <text x="165" y="73" fontSize="11.5" fill="#c6d2e1" textAnchor="middle">client</text>
  <rect x="95" y="164" width="140" height="34" rx="6" fill="rgba(142,131,254,0.14)" stroke="#8e83fe" strokeOpacity="0.85"/>
  <text x="165" y="185" fontSize="11.5" fill="#8e83fe" textAnchor="middle">host</text>
  <line x1="165" y1="86" x2="165" y2="164" stroke="rgba(255,255,255,0.22)" strokeDasharray="5 4"/>
  <text x="180" y="130" fontSize="9.5" fill="#7a8699">"anything new?" every x seconds</text>
  <g className="schema-packet" opacity="0">
    <rect x="-9" y="-8" width="18" height="16" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)"/>
    <text x="0" y="3.5" fontSize="10" fill="#c6d2e1" textAnchor="middle">?</text>
    <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear"
      path="M165,96 L165,154"
      keyPoints="0;0;1;1" keyTimes="0;0.55;0.75;1"/>
    <animate attributeName="opacity" dur="6s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.55;0.6;0.72;0.76;1"/>
  </g>
  {/* Events side: host pushes through xo-server to every client, instantly. */}
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="390" y="52" width="115" height="30" rx="6"/>
    <rect x="525" y="52" width="115" height="30" rx="6"/>
  </g>
  <g fontSize="10.5" fill="#c6d2e1" textAnchor="middle">
    <text x="447" y="71">client</text>
    <text x="582" y="71">client</text>
  </g>
  <rect x="440" y="104" width="150" height="32" rx="6" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="515" y="124" fontSize="11.5" fill="#6aabf0" textAnchor="middle">xo-server</text>
  <rect x="445" y="166" width="140" height="34" rx="6" fill="rgba(142,131,254,0.14)" stroke="#8e83fe" strokeOpacity="0.85"/>
  <text x="515" y="187" fontSize="11.5" fill="#8e83fe" textAnchor="middle">host</text>
  <g className="schema-flow" stroke="#6aabf0" strokeWidth="1.4" strokeDasharray="5 4">
    <line x1="515" y1="166" x2="515" y2="136"/>
    <line x1="497" y1="104" x2="450" y2="82"/>
    <line x1="533" y1="104" x2="580" y2="82"/>
  </g>
  <text x="600" y="150" fontSize="9.5" fill="#7a8699" textAnchor="middle">instant</text>
  <g className="schema-packet" opacity="0">
    <circle r="5" fill="#56c288"/>
    <animateMotion dur="5s" repeatCount="indefinite" calcMode="linear"
      path="M515,160 L515,140 L497,104 L452,84"
      keyPoints="0;0;1;1" keyTimes="0;0.1;0.32;1"/>
    <animate attributeName="opacity" dur="5s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.1;0.13;0.29;0.33;1"/>
  </g>
  <g className="schema-packet" opacity="0">
    <circle r="5" fill="#56c288"/>
    <animateMotion dur="5s" repeatCount="indefinite" calcMode="linear"
      path="M515,160 L515,140 L533,104 L578,84"
      keyPoints="0;0;1;1" keyTimes="0;0.1;0.32;1"/>
    <animate attributeName="opacity" dur="5s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.1;0.13;0.29;0.33;1"/>
  </g>
</svg>
</Schema>

## The web interfaces

Two web UIs currently ship with Xen Orchestra, served by `xo-server` and talking to it over WebSockets:

- **XO 6** (`@xen-orchestra/web`), the new default interface, built with Vue.js on a dedicated design system. See the [XO 6 documentation](xo6/gettingstarted.md).
- **XO 5** (`xo-web`), the complete historical interface, built with React. See [the infrastructure management section](xo5/manage_infrastructure.md) for what you can do with it.

<UiShot light="/img/xo6/dashboard-light.png" dark="/img/xo6/dashboard-dark.png" alt="XO 6, the new default web interface" url="https://your-xo/v6/#/dashboard" />

Both run against the same server and the same data at the same time: see [XO 6 and XO 5](xo6/xo6vsxo5.md).

## xo-cli

[`xo-cli`](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-cli) sends commands to `xo-server` from a shell. Thanks to introspection, it discovers every method the server exposes, plus a convenient wrapper around the REST API.

:::warning
`xo-cli` is mainly a debug and power-user tool: there is no absolute guarantee on its stability. Prefer the [REST API](automation/restapi.md) for automation.
:::

Register your XO instance first (only a token is stored):

<Terminal title="workstation — register your XO">{`
xo-cli register http://xo.my-company.net admin@admin.net admin
Successfully logged with admin@admin.net
`}</Terminal>

Discover what the server exposes:

<Terminal shell title="workstation — explore the API">{`
xo-cli list-commands  # every available method
xo-cli list-commands '{user,group}.*'  # filtered by pattern
xo-cli list-objects type=VM-template  # objects, filterable by properties
`}</Terminal>

Then call any method with `xo-cli <command> <param>=<value>`:

<Terminal title="workstation — add a server">{`
xo-cli server.add host=my.server.net username=root password=secret-password
42
`}</Terminal>

Parameters are strings by default (`true`/`false` are parsed as booleans); prefix with `json:` for other types (`baz='json:[1, 2, 3]'`). `xo-cli help` documents everything, including the `xo-cli rest get|post|patch|del` subcommands that map directly onto the REST API.

:::note
`xo-cli` imports XVA files only (`xo-cli vm.import sr=<SR UUID> @=vm.xva`). For OVA imports, use the web UI or [`xo-upload-ova`](https://github.com/vatesfr/xen-orchestra/blob/master/@xen-orchestra/upload-ova/README.md#xo-upload-ova).
:::

## APIs

The public, supported API of Xen Orchestra is the **[REST API](automation/restapi.md)**: plain HTTP, easy to call from any language or tool, with its own documentation page and a live OpenAPI reference at `/rest/v0/docs/` on your XO.

Internally, the web UIs and `xo-cli` talk to `xo-server` over a JSON-RPC-over-WebSockets protocol: that connected mode is what lets clients subscribe to events and stay current in real time. This internal API is not designed for third parties: if you automate against XO, use the REST API.

## Plugins

Plugins extend Xen Orchestra without touching its core. They live in "Settings, then Plugins":

<UiDetail src="/img/xoa/plugins-menu.png" alt="The Plugins page in Settings" width={520} />

Each plugin can be activated or deactivated, loaded at startup, and configured entirely from the web interface:

<UiDetail src="/img/xoa/plugins-page.png" alt="Configuring a plugin from the web interface" width={520} />
