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

## Requirements

Hosts run a `vdf-agent` recent enough to provide the `check`, `publish`, `stats` and `rule_log` plugin functions. A host whose agent doesn't is reported, not fatal.
