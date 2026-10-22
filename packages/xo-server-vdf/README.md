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
| `POST actions/publish_policy` | `{ policy }`: validate and publish, as `vdf-agent publish` does                                                            |
| `POST actions/trace`          | `{ from, to, proto, port?, state? }`: why is this blocked? One hop per host involved, as `vdf-agent trace` orchestrates it |
| `GET stats`                   | Per host: rule hit rates, open connections with the rule that let them in, blocked attempts                                |
| `GET rule-log`                | Entries of every host's per-rule audit log, oldest first (`lines`, `since`)                                                |

## Global configuration

Groups and policies defined once in XO and written into every pool in scope (all pools, or a list), next to each pool's own (`global.mjs`). Agents only ever see their pool's document, so a pool keeps enforcing its last document whatever happens to XO or to the other pools.

- **Ownership in a pool's document:** XO owns every group and policy named `global:*` and the rule ids from `0x800000` up (agents refuse unknown fields, so names carry the origin). Pool routes rewrite that part on every check and publish: a pool's edit can't change it, and a pool's own rule ids must stay below that range.
- **Order:** global policies come first in the document. Agents take a tier's policies in document order, so in a tier shared with the pool's own policies, global rules match first. A global policy in the baseline tier sets defaults the pools can override.
- **Members across pools:** each pool's agents resolve tag groups from their own VMs. For every global group, XO adds the IPs of its running members in the other pools in scope: a locked VIF's allowed addresses, else what the guest reports, as agents count them.
- **Publish:** every pool in scope (and every pool still holding a global part) checks its new document with its master's agent. Nothing is written unless every reachable pool accepts it. Pools XO can't reach are reported and catch up later.
- **Sync:** XO follows its object events (throttled to one pass every 5 s, plus one a minute) and republishes a pool whose global part differs from what it should be: new members in other pools, a pool back online, a pool that left the scope, or an edit made outside XO.
- **Storage:** XO's store (`getStore('vdf')`), key `global`: `{ document, revision, scope, publishedAt, publishedBy }`. Publishing with an older `revision` is refused.

| Route                          | What                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `GET /global`                  | The global configuration, each pool's sync state, and the members of global groups      |
| `POST /global/actions/check`   | `{ policy, scope }`: every pool in scope checks its resulting document, nothing written |
| `POST /global/actions/publish` | `{ policy, scope, revision }`: check, then publish to every pool                        |

## Requirements

Hosts run a `vdf-agent` recent enough to provide the `check`, `publish`, `stats` and `rule_log` plugin functions. A host whose agent doesn't is reported, not fatal.
