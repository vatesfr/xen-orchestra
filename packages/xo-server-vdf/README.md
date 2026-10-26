# xo-server-vdf

> Vates Distributed Firewall (VDF): REST routes for XO 6's Firewall screens

VDF is a stateful firewall in front of every VM, enforced by each host's `vdf-agent` with Open vSwitch connection tracking and driven by tags. The policy lives in the pool (`pool.other_config["vdf:policy*"]`), each agent reports what it enforces in its host's `other_config["vdf:status"]`.

This plugin never re-implements the agent's rules: validation, publication and traces go through the hosts' `vdf` XAPI plugin, which the agent installs.

## Tech preview: opt-in, and the off switch

Installed is not enabled: the plugin has a required setting, so xo-server leaves it unloaded until an administrator ticks **Enable the VDF firewall (tech preview)** in Settings > Plugins and loads it ([vdf#42](https://git.vates.tech/vates/vdf/issues/42)).

XO 6 shows the firewall only while `GET /rest/v0/plugins/vdf/info` answers, and the VM tab and Quarantine only in pools VDF manages: a host's agent wrote a status, or a policy is published (so a pool whose agents stopped or were removed still shows its VMs as exposed). Unloading the plugin is the off switch for XO: its routes and background sync stop, and the interface disappears within a minute. Policies already published stay enforced by the hosts' agents.

In XAPI, the plugin writes `vdf:*` keys of `pool.other_config` only: `vdf:global.owner` itself, the `vdf:policy*` keys through the master agent's `publish`. It never writes host or network `other_config`, nor tags: XO 6 tags VMs and networks through XO's own REST API, as any tag edit. `index.test.mjs` ("what the plugin writes in XAPI") checks the code and every route.

To stop enforcement too, without XO (from any host's shell, with the agent's own commands):

- **A pool:** `vdf-agent unpublish` with no argument, on any host of the pool, removes every `vdf:policy*` key of `pool.other_config` in one write. Each agent then drops its VDF flows after a 3 s grace and forgets its last valid policy, so the policy doesn't come back. Unload this plugin first, or take the pool out of the global configuration's scope: while it's loaded, the global sync writes the pool's global part back within seconds.
- **A host:** `systemctl stop vdf-agent`, then `vdf-agent clear`, which removes the VDF flows, port flags and MAC pins from the host's bridges and its status. A stopped agent alone leaves the last flows in place.
- **Quarantine** follows the `vdf:quarantine` VM tag, whatever the pool's document: an unpublished pool still cuts its quarantined VMs off. Remove the tag, or stop and clear the agents.

XO has no off switch of its own yet beyond unloading the plugin ([vdf#42](https://git.vates.tech/vates/vdf/issues/42)).

## Routes

Under `/rest/v0/plugins/vdf/pools/{id}`:

| Route                         | What                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET policy`                  | The document the pool enforces (the newest pool key whose base still matches, as agents choose it) and its id              |
| `POST actions/check_policy`   | `{ policy }`: validate with the pool master's agent, nothing written                                                       |
| `POST actions/publish_policy` | `{ policy, expectedDocId? }`: validate and publish, as `vdf-agent publish` does (see below)                                |
| `POST actions/trace`          | `{ from, to, proto, port?, state? }`: why is this blocked? One hop per host involved, as `vdf-agent trace` orchestrates it |
| `GET stats`                   | Per host: rule hit rates, open connections with the rule that let them in, blocked attempts                                |
| `GET rule-log`                | Entries of every host's per-rule audit log, oldest first (`lines`, `since`)                                                |
| `GET history`                 | The last documents XO published to the pool, oldest first, without their content                                           |
| `GET history/{entry}`         | One of them, with the version it replaced (`previous`, when kept)                                                          |

**Concurrent edits:** with `expectedDocId` (the id of the document the edit started from, `''` for none), a publish is refused with `conflict: true` and nothing is written if the pool's document changed meanwhile. Publishes through XO are serialized per pool, so two of them cannot both pass the check; a write made in between by the global configuration or outside XO (`vdf-agent publish`) makes the check fail, which is the point.

## Global configuration

Groups and policies defined once in XO and written into every pool in scope (all pools, or a list), next to each pool's own (`global.mjs`). Agents only ever see their pool's document, so a pool keeps enforcing its last document whatever happens to XO or to the other pools.

- **Ownership in a pool's document:** XO owns every group and policy named `global:*` and the rule ids from `0x800000` up (agents refuse unknown fields, so names carry the origin). Pool routes rewrite that part on every check and publish: a pool's edit can't change it, and a pool's own rule ids must stay below that range.
- **Order:** global policies come first in the document. Agents take a tier's policies in document order, so in a tier shared with the pool's own policies, global rules match first. A global policy in the baseline tier sets defaults the pools can override.
- **Tiers kept for global policies** ([vdf#21](https://git.vates.tech/vates/vdf/issues/21)): tiers decide in order whoever wrote the policies in them, so a pool's own allow in `emergency` would decide before a global drop in `securityops`. In a pool the global configuration applies to (in scope, or holding another XO's global part), the pool's own policies may not use the tiers up to `securityops` (`emergency`, `securityops`, numbered tiers up to 25): pool checks and publishes refuse them, and XO 6 doesn't offer them there. A global policy in an earlier or the same tier therefore always wins. Pools out of scope keep every tier; global policies use any.
  - A global publish that brings a pool into the scope while its own policies use those tiers is refused for that pool (`reservedTiers` lists them, nothing is written anywhere): it would claim a guardrail the pool doesn't have. Move them to `networkops` or a later tier first.
  - A pool can still end up in scope with some (connected later under "all pools", unreachable at the publish, or edited outside XO): XO writes the global part anyway, since it only adds to what the pool enforces, reports the pool's `reservedTiers` in `GET /global` and as a warning at the next global publish, and the pool can't publish its own part until they're moved.
- **Members across pools:** each pool's agents resolve tag groups from their own VMs. For every global group, XO adds the IPs of its running members in the other pools in scope: a locked VIF's allowed addresses, else what the guest reports, as agents count them.
- **Addresses held twice:** a member's IP that another running VM (any pool) holds too is left out of the other pools at once, and reported in `conflicts`: they couldn't tell the two VMs apart. The same IP on VMs of two pools in scope is reported in `overlaps`: members across pools only make sense if the pools share a routed address space.
- **A pool XO loses** keeps its members in the other pools, with their last known IPs (fail static), as long as XO still has the pool's server; members are dropped once the server is removed from XO. Key `vms` of the store: the running VMs of each pool when XO last saw them. The pool shows as unreachable, its members as `stale`.
- **One XO per pool:** the XO that writes a global part into a pool (once the write succeeded) records itself in `pool.other_config["vdf:global.owner"]` (`{ id, name, since }`, id kept in the store's `instance` key). Another XO then leaves that pool's global part alone: its sync skips the pool, its global publishes report it (`otherXo`) without failing, and its pool routes keep that global part as is. `POST /pools/{id}/actions/take_over_global` makes this XO the owner.
  - **What the owner records** ([vdf#81](https://git.vates.tech/vates/vdf/issues/81)): with each write of the pool's global part (and at the next sync for pools written before), the owner adds `revision` and `scope` of the configuration it wrote, and `ips`, each global group's own IPs: the pool's document merges them with the members' in the other pools. Agents don't read it; recovery does.
  - **A take over that would drop the global part is refused** ([vdf#81](https://git.vates.tech/vates/vdf/issues/81)): an XO without a global configuration that took over a pool holding a global part would write the pool without it at its next write. `take_over_global` and `take_over_replaced` answer 409 (`noGlobal: true`) and write nothing, unless the request says `dropGlobal: true`; the pool's global rules then go at its next publish.
- **A restored or copied XO keeps its own identity** ([vdf#20](https://git.vates.tech/vates/vdf/issues/20)): importing a config export never adopts the exported `instance`, so an export restored on a second XO while the first one runs (upgrade test, staging copy, DR rehearsal) can't make both write the same pools. The import keeps (or creates) this XO's own id, takes the global configuration, histories and syncs, and records the exported XO in the store's `replaces` key (`{ id, name, importedAt }`, reported by `GET /global`); importing this XO's own export changes nothing. The pools that XO owns show as `other-xo` until an administrator takes them over: `POST /global/actions/take_over_replaced` (Global firewall > Overview, "Take over its pools") runs one `take_over_global` per pool, expecting that XO as the owner. That's the only way another XO's pools become this one's. A copy of XO's whole data directory (a VM clone) still shares the identity: XO has no install id to tell the copies apart.
- **An XO lost without a backup** ([vdf#81](https://git.vates.tech/vates/vdf/issues/81)): its pools keep enforcing, and show as `other-xo` on a fresh XO. As long as this XO has no global configuration, `GET /global` reports, per XO owning pools that hold a global part (other than the one this XO replaces), the configuration they let rebuild (`recoverable`): the `global:*` groups and policies without the prefix, rule ids minus `0x800000`, the groups' own IPs and the revision the owner recorded. Pools holding different versions (unreachable at the last publish, edited outside XO): the highest revision wins, else the most common version, and the others, whose global part will change, are listed (`differs`). From pools written before the owner recorded them, it's best effort (`exact: false`): a group's IPs are those every such pool holds, which can include members in other pools. Recovery trusts what the pools hold, which anyone with XAPI access to a pool can write: the scope is therefore the pools holding the global part, whatever the owner recorded (`recordedScope`, shown only), and XO 6 summarizes what's adopted before the administrator confirms. `POST /global/actions/recover` saves it (the recorded revision + 1, or 1; the request's `scope`, if any, widens it), records the lost XO in `replaces` as an import of its export would (`{ id, name, recoveredAt }`), and only then takes its pools over as `take_over_replaced` does: the first sync writes the same global parts there, with fresh members. The global history starts from it; the pool histories from what the pools hold, at their first publish.
- **Publish:** every pool in scope (and every pool still holding a global part) checks its new document with its master's agent. Nothing is written unless every reachable pool accepts it. Pools XO can't reach are reported and catch up later. `revision` is required (0 for the first publish): from an older one, the publish is refused with `conflict: true`, as a pool's. A scope naming a pool XO doesn't know is refused. The configuration is saved before the pools are written: a pool whose write fails makes the publish `partial` (no rollback), and is retried 5 s later.
- **One write path:** global publishes, the sync and pool publishes write a pool one at a time (per-pool lock), each composing from what the pool holds at that moment and re-reading its owner: a pool publish is never undone by a sync that read the pool before it. XAPI has no compare-and-set on `other_config`, so a window as short as the agent's call remains against writers outside this XO.
- **Sync:** XO follows its object events (throttled to one pass every 5 s, plus one a minute) and republishes a pool whose global part differs from what it should be: new members in other pools, a pool back online, a pool that left the scope, or an edit made outside XO.
- **Storage:** XO's store (`getStore('vdf')`), key `global`: `{ document, revision, scope, publishedAt, publishedBy }`. Publishing with an older `revision` is refused. Key `syncs`: each pool's last write (shown as "Last sync"), so it survives a restart.

| Route                                       | What                                                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /global`                               | The global configuration, each pool's sync state, the members of global groups, and what can be recovered from the pools (`recoverable`)                          |
| `POST /global/actions/check`                | `{ policy, scope }`: every pool in scope checks its resulting document, nothing written                                                                           |
| `POST /global/actions/publish`              | `{ policy, scope, revision }`: check, then publish to every pool                                                                                                  |
| `GET /global/history`                       | The last published global configurations, oldest first, without their content                                                                                     |
| `GET /global/history/{entry}`               | One of them (document and scope), with the one before it (`previous`)                                                                                             |
| `POST /pools/{id}/actions/take_over_global` | `{ expectedOwner, dropGlobal? }`: make this XO the pool's owner for the global configuration, refused (409) if the owner isn't the one the user saw               |
| `POST /global/actions/take_over_replaced`   | `{ replaces, dropGlobal? }`: take over every pool the XO this one replaces owns (one `take_over_global` each), refused (409) if it replaces another XO now        |
| `POST /global/actions/recover`              | `{ from, scope? }`: save the configuration rebuilt from the pools of the XO `from`, then take its pools over, refused (409) if this XO has a global configuration |

## Permissions

XO administrators can do everything. Other users, on a pool they have an ACL on, see its firewall (pool routes, with the `view` permission) and change the pool's own part (`check_policy` and `publish_policy`, with `administrate`); `GET policy` says whether they can (`canEdit`). The global configuration is for XO administrators only, as it applies to pools a user may not see: other users get it read-only from `GET /global`, with the pools and members they may view.

## History

XO keeps the last 50 published documents per scope (each pool, and the global configuration) in its store, keys `history:<pool id>` and `history:global`: `{ id, docId | revision, previousDocId, publishedAt, publishedBy, summary, document }`. `summary` counts the groups, policies and rules added, removed and modified, plus the size of the document (for a pool, its own part: the global part has its own history). The first pool publish also records what the pool held before (`publishedAt: null`), and the stored global configuration starts the global history. Publishing the same document again adds nothing. The pool history only covers publishes made through XO's pool routes: the global configuration's writes to the pools are in the global history.

XO 6 shows it in the Firewall's History tab, where a version can be restored as a draft, then reviewed and published like any edit.

## Config backup

The plugin registers a `vdf` config manager, so XO's config export (Settings > Config) includes the global configuration, the histories and the sync records, and importing it restores them (a loaded plugin reloads them at once), but not the exported XO's identity (see "A restored or copied XO" above). Pool documents live in the pools and aren't part of it. Without an export, the global configuration can be recovered from the pools (see "An XO lost without a backup" above). The manager is registered once per process, when xo-server registers the plugin, whether it's loaded or not: importing an export that has a `vdf` entry into an XO without this plugin fails, as for any unknown config manager.

## Requirements

Hosts run a `vdf-agent` recent enough to provide the `check`, `publish`, `stats` and `rule_log` plugin functions. A host whose agent doesn't is reported, not fatal.
