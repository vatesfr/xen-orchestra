# Load balancing

<InterfaceNote />

## Basic notions

A generic definition, from Wikipedia:

> In computing, load balancing distributes workloads across multiple computing resources, such as computers, a computer cluster, network links, central processing units or disk drives.

In the case of virtualization, you have multiple physical hosts, which run your virtual machines (VMs). The goal here is to **distribute the VM load** in the best way possible across your servers.

:::tip
You may have heard about VMware DRS (Distributed Resource Scheduler). That's the same principle here, but for XCP-ng.
:::

The first goal is to adapt your VM placement in real time, without service interruption, depending on the load. Since Xen Orchestra is connected to [multiple pools](../architecture.md#xo-server) and XCP-ng supports live storage motion, we can perform load balancing on a **whole XCP-ng infrastructure**, even between remote datacenters.

:::tip
A load balancing policy is called a **plan**.
:::

Here's a simple example, with 2 hosts running 6 VMs:

<Schema label="A quiet cluster: two hosts, six VMs" legend={[["#56c288", "VM"]]} maxWidth="640px">
<svg viewBox="0 0 640 220" role="img" aria-label="Two hosts each running three healthy VMs, both using 5 percent of their CPUs">
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="25" y="40" width="280" height="150" rx="10"/>
    <rect x="335" y="40" width="280" height="150" rx="10"/>
  </g>
  <g fontSize="12.5" fill="#7a8699">
    <text x="41" y="64">Host 1</text>
    <text x="351" y="64">Host 2</text>
  </g>
  <g fontSize="11" textAnchor="end" fill="#56c288">
    <text x="289" y="64">CPU 5%</text>
    <text x="599" y="64">CPU 5%</text>
  </g>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288">
    <rect x="45" y="94" width="64" height="44" rx="5"/>
    <rect x="129" y="94" width="64" height="44" rx="5"/>
    <rect x="213" y="94" width="64" height="44" rx="5"/>
    <rect x="355" y="94" width="64" height="44" rx="5"/>
    <rect x="439" y="94" width="64" height="44" rx="5"/>
    <rect x="523" y="94" width="64" height="44" rx="5"/>
  </g>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="77" y="120">VM 1</text>
    <text x="161" y="120">VM 2</text>
    <text x="245" y="120">VM 3</text>
    <text x="387" y="120">VM 4</text>
    <text x="471" y="120">VM 5</text>
    <text x="555" y="120">VM 6</text>
  </g>
</svg>
</Schema>

Let's say both hosts are using only 5% of all their CPUs. Suddenly, one of your VMs starts to have a very high CPU load (in red): the other VMs on this same host end up starved for CPU (in amber):

<Schema label="VM 5 heats up, its neighbors starve" legend={[["#ef6a5f", "CPU-hungry"], ["#e0a94a", "starved"]]} maxWidth="640px">
<svg viewBox="0 0 640 220" role="img" aria-label="VM 5 on Host 2 spikes to a very high CPU load, starving VM 4 and VM 6 on the same host, while Host 1 stays at 5 percent">
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="25" y="40" width="280" height="150" rx="10"/>
    <rect x="335" y="40" width="280" height="150" rx="10"/>
  </g>
  <g fontSize="12.5" fill="#7a8699">
    <text x="41" y="64">Host 1</text>
    <text x="351" y="64">Host 2</text>
  </g>
  <text x="289" y="64" fontSize="11" textAnchor="end" fill="#56c288">CPU 5%</text>
  <text x="599" y="64" fontSize="11" textAnchor="end" fill="#ef6a5f">CPU 95%</text>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288">
    <rect x="45" y="94" width="64" height="44" rx="5"/>
    <rect x="129" y="94" width="64" height="44" rx="5"/>
    <rect x="213" y="94" width="64" height="44" rx="5"/>
  </g>
  <g fill="rgba(224,169,74,0.12)" stroke="#e0a94a" strokeOpacity="0.85">
    <rect x="355" y="94" width="64" height="44" rx="5"/>
    <rect x="523" y="94" width="64" height="44" rx="5"/>
  </g>
  <g className="schema-glow">
    <rect x="439" y="94" width="64" height="44" rx="5" fill="rgba(239,106,95,0.2)" stroke="#ef6a5f" strokeWidth="1.6"/>
  </g>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="77" y="120">VM 1</text>
    <text x="161" y="120">VM 2</text>
    <text x="245" y="120">VM 3</text>
    <text x="387" y="116">VM 4</text>
    <text x="471" y="116">VM 5</text>
    <text x="555" y="116">VM 6</text>
  </g>
  <text x="471" y="131" fontSize="9" fill="#ef6a5f" textAnchor="middle">100% CPU</text>
  <g fontSize="9" fill="#e0a94a" textAnchor="middle">
    <text x="387" y="131">waiting…</text>
    <text x="555" y="131">waiting…</text>
  </g>
</svg>
</Schema>

`Host 1` is still using 5% of its CPUs, but `Host 2` is now at 95%.

The load balancer detects it, and moves the starved VMs to the other host:

<Schema label="The plan reacts: starved VMs move out and turn healthy, the busy VM gets the host" legend={[["#56c288", "healthy"], ["#e0a94a", "starved"], ["#ef6a5f", "CPU-hungry"]]} maxWidth="640px">
<svg viewBox="0 0 640 250" role="img" aria-label="VM 4 and VM 6 are live migrated from Host 2 to Host 1, becoming healthy again, leaving the CPU-hungry VM 5 alone on Host 2">
  <g fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5">
    <rect x="25" y="40" width="280" height="180" rx="10"/>
    <rect x="335" y="40" width="280" height="180" rx="10"/>
  </g>
  <g fontSize="12.5" fill="#7a8699">
    <text x="41" y="64">Host 1</text>
    <text x="351" y="64">Host 2</text>
  </g>
  {/* Host CPU gauges: start as in FIG 2 (5% / 95%), update once both
  VMs have landed. Static (reduced-motion) readers see the final state. */}
  <g className="schema-transient" fontSize="11" textAnchor="end" opacity="1">
    <text x="289" y="64" fill="#56c288">CPU 5%</text>
    <text x="599" y="64" fill="#ef6a5f">CPU 95%</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="1;1;0;0;1;1" keyTimes="0;0.27;0.3;0.96;0.99;1"/>
  </g>
  <g className="schema-live" fontSize="11" textAnchor="end" opacity="0">
    <text x="289" y="64" fill="#56c288">CPU 15%</text>
    <text x="599" y="64" fill="#e0a94a">CPU 80%</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.27;0.3;0.94;0.96;1"/>
  </g>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288">
    <rect x="45" y="84" width="64" height="44" rx="5"/>
    <rect x="129" y="84" width="64" height="44" rx="5"/>
    <rect x="213" y="84" width="64" height="44" rx="5"/>
  </g>
  <g className="schema-glow">
    <rect x="439" y="94" width="64" height="44" rx="5" fill="rgba(239,106,95,0.2)" stroke="#ef6a5f" strokeWidth="1.6"/>
  </g>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="77" y="110">VM 1</text>
    <text x="161" y="110">VM 2</text>
    <text x="245" y="110">VM 3</text>
    <text x="471" y="116">VM 5</text>
  </g>
  <text x="471" y="131" fontSize="9" fill="#ef6a5f" textAnchor="middle">100% CPU</text>
  <text className="schema-transient" x="330" y="236" fontSize="9.5" fill="#7a8699" textAnchor="middle">live migration</text>
  {/* VM 4: origin (starved, on Host 2) fades out, a mover rides the
  wire, the healthy copy appears on Host 1. */}
  <g className="schema-live" opacity="1">
    <rect x="355" y="94" width="64" height="44" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" strokeOpacity="0.85"/>
    <text x="387" y="116" fontSize="11" fill="#c6d2e1" textAnchor="middle">VM 4</text>
    <text x="387" y="131" fontSize="9" fill="#e0a94a" textAnchor="middle">waiting…</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="1;1;0;0;1;1" keyTimes="0;0.15;0.17;0.96;0.99;1"/>
  </g>
  <g className="schema-packet" opacity="0">
    <rect x="-32" y="-22" width="64" height="44" rx="5" fill="rgba(224,169,74,0.16)" stroke="#e0a94a"/>
    <text x="0" y="4" fontSize="11" fill="#e0a94a" textAnchor="middle">VM 4</text>
    <animateMotion dur="12s" repeatCount="indefinite" calcMode="linear"
      path="M387,116 C 330,158 220,128 119,174"
      keyPoints="0;0;1;1" keyTimes="0;0.15;0.27;1"/>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.15;0.16;0.26;0.28;1"/>
  </g>
  <g className="schema-live" opacity="0">
    <rect x="87" y="152" width="64" height="44" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
    <text x="119" y="178" fontSize="11" fill="#c6d2e1" textAnchor="middle">VM 4</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.26;0.28;0.94;0.96;1"/>
  </g>
  {/* VM 6: same journey, at the same time. */}
  <g className="schema-live" opacity="1">
    <rect x="523" y="94" width="64" height="44" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" strokeOpacity="0.85"/>
    <text x="555" y="116" fontSize="11" fill="#c6d2e1" textAnchor="middle">VM 6</text>
    <text x="555" y="131" fontSize="9" fill="#e0a94a" textAnchor="middle">waiting…</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="1;1;0;0;1;1" keyTimes="0;0.15;0.17;0.96;0.99;1"/>
  </g>
  <g className="schema-packet" opacity="0">
    <rect x="-32" y="-22" width="64" height="44" rx="5" fill="rgba(224,169,74,0.16)" stroke="#e0a94a"/>
    <text x="0" y="4" fontSize="11" fill="#e0a94a" textAnchor="middle">VM 6</text>
    <animateMotion dur="12s" repeatCount="indefinite" calcMode="linear"
      path="M555,116 C 500,180 340,190 219,174"
      keyPoints="0;0;1;1" keyTimes="0;0.15;0.27;1"/>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.15;0.16;0.26;0.28;1"/>
  </g>
  <g className="schema-live" opacity="0">
    <rect x="187" y="152" width="64" height="44" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
    <text x="219" y="178" fontSize="11" fill="#c6d2e1" textAnchor="middle">VM 6</text>
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
      values="0;0;1;1;0;0" keyTimes="0;0.26;0.28;0.94;0.96;1"/>
  </g>
</svg>
</Schema>

`Host 1` has a slightly higher load, but `Host 2` can fully handle the "problematic" VM without disrupting the other VMs.

This way, the heavy load on a single VM doesn’t end up penalizing everything else.

However, there are more ways to look at it and optimize your resource usage:

- **Performance mode:** You might want to spread VM workloads across as many servers as possible, to get the most out of your hardware (as in the previous example).
- **Density mode:** You might prefer to reduce power consumption by consolidating VMs onto as few hosts as possible, then shutting down the unused ones.

## Configuration

### Essential parameters

Load balancing plans have:

- A name
- Pool(s) where to apply the policy
- A mode (see [Plan modes](#plan-modes))

:::warning
A pool can only belong to **one** plan: the plugin will refuse a configuration where two plans share a pool.
:::

### Plan modes

Plans can work in one of these 3 modes:

- **Performance:** VMs are placed to make the most of all available resources: the load is spread across every available host, to give the best overall performance.\
   To specify how the performance plan should act, see the [Performance plan behavior](#performance-plan-behavior) section.

- **Density:** This time, the objective is to use the least hosts possible, and to concentrate your VMs. In this mode, emptied hosts are shut down. A few safety rules apply: the pool master is never evacuated, and only hosts with a **power-on mode** configured (so XO can power them back on later) are candidates for shutdown. A host is also skipped if any of its running VMs cannot be migrated (missing guest tools, or carrying an affinity/anti-affinity tag).
- **Simple:** This mode allows you to use [VM affinity](#vm-affinity) and [anti-affinity](#vm-anti-affinity) without any load balancing mechanism.

:::tip
The performance plan also powers halted hosts back on: any halted host of the plan's pools with a power-on mode configured is started, so its resources are available to spread the load. This is the counterpart of the density plan shutting hosts down.
:::

### Create a new plan

To create a new plan:

1. From the navigation bar, go to the **Settings → Plugins** section.
2. Open the **load-balancer** plugin and click the **+** button to show the **Configuration** menu:

   <UiDetail src="/img/xo5/load_balancing_configuration.png" alt="The load-balancer plugin, in Settings › Plugins" width={700} />

   Here, you can create a new load balancing plan or edit an existing one.

3. In **Configuration → Plans**, check the box called **Fill information (optional)**:
   <UiDetail src="/img/xo5/load_balancing_fill_information.png" alt="Check “Fill information (optional)” to reveal the Add button" width={480} />\
   The **Add** button will appear.
4. Click **Add**:
   <UiDetail src="/img/xo5/load_balancing_add.png" alt="Click Add to create a new plan" width={700} />
   A new form will open, where you can set up your plan:
   <UiDetail src="/img/xo5/load_balancing_new_plan.png" alt="The new plan form: name, mode, pools" width={620} />

5. Enter a **Name** for your plan.
6. Select a **Mode**.
7. Choose the **pools** where the plan should apply.
8. Go to the bottom of the page and click **Save configuration**.\
   Your load balancing plan is saved and ready to work.

### Critical thresholds

In a load balancing plan, you can define two critical thresholds:

- CPU usage (%)
- Free memory (MB)

To configure thresholds for your plan:

1. Go to **Configuration → Plans**.
2. Select the plan you want to update.
3. Go to **Plan → Critical thresholds**.
4. Check the **Fill information (optional)** box.\
   New fields will appear where you can set your thresholds:

<UiDetail src="/img/xo5/load_balancing_thresholds.png" alt="Set the critical thresholds of the plan" width={620} />

The defaults are **90%** for CPU and **1000 MB** of free memory.

:::warning
The threshold you configure is the **critical** value, and the plugin deliberately acts *before* reaching it: a host is considered overloaded when its average CPU usage exceeds **85% of the critical value** (76.5% with the default 90%), and migrations continue until it falls back under **65% of it** (58.5% by default). For memory it's symmetrical: migrations start when free RAM drops below **1.2×** the configured value (1200 MB by default) and stop once it's back above **1.5×** (1500 MB by default).
:::

To avoid reacting to a momentary spike, the decision is based on a weighted average: 75% of the last minute, 25% of the last 30 minutes. A host has to be busy *for a while* before its VMs start moving.

### Exclusion

If you want to prevent load balancing from triggering migrations on a particular host or VM, you can exclude it from the process. This can be done with:

- The **Excluded hosts** setting in each plan: an excluded host is never used as a source *or* a destination, and is never powered on or shut down by the plugin
- The **Ignored VM tags** parameter, which is common to every plan: VMs carrying one of these tags are never migrated

:::note
Only **running** VMs are considered, and a VM needs the **guest tools** installed to be live migrated: VMs without them simply stay where they are.
:::

### Timing

The global situation (resource usage) is examined **every minute**, and each run works on smoothed metrics rather than instant values (see [Critical thresholds](#critical-thresholds)).

Every migration decided by the plugin is visible in the XO **Tasks** view, as a task named "Load balancer migrates VM …" whose description tells you the source, the destination and the *reason*: CPU over threshold for too long, CPU significantly higher than the pool average, vCPU balancing, affinity or anti-affinity satisfaction, or a density-plan host shutdown. Nothing moves silently.

:::tip
During a [Rolling Pool Update](./manage_infrastructure#rolling-pool-updates-rpu), the load balancer is automatically suspended, and re-enabled 30 minutes after the update completes, so the two features never fight over VM placement.
:::

### Advanced settings

The advanced settings fine-tune how migrations are performed. They are global: they apply to every plan.

To change them:

1. Go to **Configuration → Advanced**.
2. Check the **Fill information (optional)** box.\
   A list of advanced parameters will appear.
3. Configure the parameters as needed.
4. Scroll to the bottom of the page and click **Save configuration**.\
   Your changes will be applied immediately.

#### Maximum concurrent migrations

This option lets you define the maximum number of migrations that can run at the same time (default: **2**, shared by all plans). Limiting concurrent migrations can help maintain the overall performance of your environment.

#### Migration cooldown

This option prevents the load balancer from migrating the same VM twice in quick succession, by forcing a given delay between load-balancer-related migrations. Defaults to **30 minutes**, set to 0 to disable it.

:::note
The density plan does not apply the cooldown: when it evacuates a host to shut it down, it moves everything.
:::

<UiDetail src="/img/xo5/load_balancing_advanced_settings.png" alt="The advanced settings of the plugin" width={700} />

### Performance plan behavior

With a performance plan, you can pick a behavior that adds extra logic on top of the plan's threshold-based balancing. The default behavior always stays active: these options complement it, they don't replace it.

<UiDetail src="/img/xo5/load_balancing_performance_plan_behavior.png" alt="The three behaviors of a performance plan" width={700} />

#### Conservative (default)

This is the standard behavior of the performance plan.

#### Preventive

By default, the performance plan only migrates VMs once CPU or memory usage reaches critical levels. The Preventive option goes further by trying to reduce CPU usage imbalances between hosts in the pool. For example, it aims to avoid a situation where one host runs at 60% CPU while others sit at 10%, something the default behavior would normally allow. Concretely, it kicks in when a host uses at least 1.5× the pool's average CPU (and at least 25% CPU), and only when no host is over the critical thresholds.

#### vCPU balancing

When the pool load is low (under 40% CPU usage), this option proactively distributes VMs across hosts to reduce large disparities in the number of vCPUs per CPU, rather than waiting until a host is overloaded.
This way, VMs are pre-positioned to minimize the number of migrations needed later as the load increases.

## VM affinity

VM affinity keeps VMs together: all the VMs sharing one of the plan's **Affinity tags** are placed on the **same host**. This is useful when a group of VMs talk to each other a lot and benefit from staying on the same machine (chatty application tiers, a VM and its cache, etc.).

Affinity runs in every plan mode, including Simple. The plugin gathers all VMs carrying a given tag onto the host that already holds most of them, and if that host lacks memory, it will even move *other*, untagged VMs out of the way to make room.

:::warning
Avoid giving a VM several affinity tags: the plugin then has to merge all these groups into one (if VM 1 has tags A and B, and VM 2 has tags B and C, then A, B and C must all land on the same host), and it logs a warning about it.
:::

## VM anti-affinity

VM anti-affinity is the opposite: it prevents VMs sharing the same tag from running on the same host. Use it to keep redundant VMs (replicas, cluster members) apart, so losing one host never takes down both copies.

For example, imagine you have several VMs running MySQL and PostgreSQL with high availability or replication.
Naturally, you don’t want both replicated databases to be placed on the same physical host.
To prevent that, set up your plan like this:

<UiDetail src="/img/xo5/antiaffinity.png" alt="A simple plan with two anti-affinity tags" width={560} />

- **Simple plan:** no active load balancing mechanism is used.
- **Anti-affinity**: we added two tags, meaning any VMs with one of these tags will not run on the same host as another VM that has the same tag (whenever possible).

You can also use the Performance plan with Anti-affinity enabled to continue migrating VMs that don’t have tags: tagged VMs are left to the affinity logic, and are never moved by the performance or density algorithms themselves.

:::tip
This feature is not limited by the number of VMs sharing the same tag. For example, if you have six VMs with the same anti-affinity tag and two hosts, the plugin will try to place three VMs on each host. It distributes VMs as evenly as possible and, in most cases, takes priority over the performance algorithm.
:::
