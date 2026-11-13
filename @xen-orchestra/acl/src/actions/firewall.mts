/**
 * A pool's firewall (VDF). The object a privilege is evaluated against is the
 * pool, so a selector selects pools (`id`, `name_label`, `tags`…) for every
 * action.
 */
export default {
  // firewall pages, status, history, rule log, trace
  read: true,
  // policies and groups
  publish: true,
  // the firewall's tags (`vdf:…`) on the pool's objects, except the quarantine
  membership: true,
  // the quarantine tag (`vdf:quarantine`) on the pool's VMs
  quarantine: {
    add: true,
    remove: true,
  },
}
