# xo-server-vdf

> Vates Distributed Firewall (VDF): REST routes for XO 6's Firewall screens

VDF is a stateful firewall in front of every VM, enforced by each host's `vdf-agent` with Open vSwitch connection tracking and driven by tags. The policy lives in the pool (`pool.other_config["vdf:policy*"]`), each agent reports what it enforces in its host's `other_config["vdf:status"]`.

This plugin never re-implements the agent's rules: validation, publication and traces go through the hosts' `vdf` XAPI plugin, which the agent installs.

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
- **Members across pools:** each pool's agents resolve tag groups from their own VMs. For every global group, XO adds the IPs of its running members in the other pools in scope: a locked VIF's allowed addresses, else what the guest reports, as agents count them.
- **Addresses held twice:** a member's IP that another running VM (any pool) holds too is left out of the other pools at once, and reported in `conflicts`: they couldn't tell the two VMs apart. The same IP on VMs of two pools in scope is reported in `overlaps`: members across pools only make sense if the pools share a routed address space.
- **A pool XO loses** keeps its members in the other pools, with their last known IPs (fail static), as long as XO still has the pool's server; members are dropped once the server is removed from XO. Key `vms` of the store: the running VMs of each pool when XO last saw them. The pool shows as unreachable, its members as `stale`.
- **One XO per pool:** the XO that writes a global part into a pool (once the write succeeded) records itself in `pool.other_config["vdf:global.owner"]` (`{ id, name, since }`, id kept in the store's `instance` key). Another XO then leaves that pool's global part alone: its sync skips the pool, its global publishes report it (`otherXo`) without failing, and its pool routes keep that global part as is. `POST /pools/{id}/actions/take_over_global` makes this XO the owner.
- **Publish:** every pool in scope (and every pool still holding a global part) checks its new document with its master's agent. Nothing is written unless every reachable pool accepts it. Pools XO can't reach are reported and catch up later. `revision` is required (0 for the first publish): from an older one, the publish is refused with `conflict: true`, as a pool's. A scope naming a pool XO doesn't know is refused. The configuration is saved before the pools are written: a pool whose write fails makes the publish `partial` (no rollback), and is retried 5 s later.
- **One write path:** global publishes, the sync and pool publishes write a pool one at a time (per-pool lock), each composing from what the pool holds at that moment and re-reading its owner: a pool publish is never undone by a sync that read the pool before it. XAPI has no compare-and-set on `other_config`, so a window as short as the agent's call remains against writers outside this XO.
- **Sync:** XO follows its object events (throttled to one pass every 5 s, plus one a minute) and republishes a pool whose global part differs from what it should be: new members in other pools, a pool back online, a pool that left the scope, or an edit made outside XO.
- **Storage:** XO's store (`getStore('vdf')`), key `global`: `{ document, revision, scope, publishedAt, publishedBy }`. Publishing with an older `revision` is refused. Key `syncs`: each pool's last write (shown as "Last sync"), so it survives a restart.

| Route                                       | What                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /global`                               | The global configuration, each pool's sync state, and the members of global groups                                                     |
| `POST /global/actions/check`                | `{ policy, scope }`: every pool in scope checks its resulting document, nothing written                                                |
| `POST /global/actions/publish`              | `{ policy, scope, revision }`: check, then publish to every pool                                                                       |
| `GET /global/history`                       | The last published global configurations, oldest first, without their content                                                          |
| `GET /global/history/{entry}`               | One of them (document and scope), with the one before it (`previous`)                                                                  |
| `POST /pools/{id}/actions/take_over_global` | `{ expectedOwner }`: make this XO the pool's owner for the global configuration, refused (409) if the owner isn't the one the user saw |

## Permissions

XO administrators can do everything. Other users, on a pool they have an ACL on, see its firewall (pool routes, with the `view` permission) and change the pool's own part (`check_policy` and `publish_policy`, with `administrate`); `GET policy` says whether they can (`canEdit`). The global configuration is for XO administrators only, as it applies to pools a user may not see: other users get it read-only from `GET /global`, with the pools and members they may view.

## History

XO keeps the last 50 published documents per scope (each pool, and the global configuration) in its store, keys `history:<pool id>` and `history:global`: `{ id, docId | revision, previousDocId, publishedAt, publishedBy, summary, document }`. `summary` counts the groups, policies and rules added, removed and modified, plus the size of the document (for a pool, its own part: the global part has its own history). The first pool publish also records what the pool held before (`publishedAt: null`), and the stored global configuration starts the global history. Publishing the same document again adds nothing. The pool history only covers publishes made through XO's pool routes: the global configuration's writes to the pools are in the global history.

XO 6 shows it in the Firewall's History tab, where a version can be restored as a draft, then reviewed and published like any edit.

## Config backup

The plugin registers a `vdf` config manager, so XO's config export (Settings > Config) includes the global configuration, the histories and the sync records, and importing it restores them (a loaded plugin reloads them at once). Pool documents live in the pools and aren't part of it. The manager is registered once per process, when xo-server registers the plugin, whether it's loaded or not: importing an export that has a `vdf` entry into an XO without this plugin fails, as for any unknown config manager.

## Requirements

Hosts run a `vdf-agent` recent enough to provide the `check`, `publish`, `stats` and `rule_log` plugin functions. A host whose agent doesn't is reported, not fatal.
