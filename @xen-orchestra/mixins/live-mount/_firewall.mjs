import { createLogger } from '@xen-orchestra/log'
import { execFile } from 'node:child_process'
import { isIPv6 } from 'node:net'
import { promisify } from 'node:util'

const { debug, warn } = createLogger('xo:mixins:LiveMount')

// every rule is tagged with this prefix and the scope of its process, so the ones a crash left
// behind can be found again, without touching the ones of another process on the same machine
const COMMENT_PREFIX = 'xo-live-mount:'

// external command: never let a stuck `iptables` hang a mount
const EXEC_TIMEOUT = 30e3

// how long `iptables` waits for the xtables lock, held by any other process editing the rules
const XTABLES_LOCK_WAIT = '5'

const execFileAsync = promisify(execFile)
const defaultExec = (command, args) => execFileAsync(command, args, { timeout: EXEC_TIMEOUT })

// enabled by default, so it must stay out of the way of the installs it cannot apply to: rather
// than failing the mounts, no rule is opened, and whatever firewall there is decides
const NOT_ROOT_RE = /you must be root/i
// ufw not installed, or not enabled: it deletes its chains when stopped
const MISSING_CHAIN_RE = /No chain\/target\/match by that name|does not exist/i
// a rule already gone, dropped by any change made to ufw meanwhile
const MISSING_RULE_RE = /Bad rule|does a matching rule exist/i

/**
 * Why the firewall cannot be driven, if that is what `error` says.
 *
 * @param {Error & { code?: unknown, stderr?: string }} error - as rejected by `execFile`
 * @returns {string | undefined}
 */
function unavailabilityOf(error) {
  if (error.code === 'ENOENT') {
    return 'iptables is not installed'
  }
  const stderr = error.stderr ?? ''
  if (NOT_ROOT_RE.test(stderr)) {
    return 'not running as root'
  }
  if (MISSING_CHAIN_RE.test(stderr)) {
    return 'ufw is not enabled'
  }
  return undefined
}

/** A failed `iptables` command, telling why when it is not a plain failure. */
export class FirewallCommandError extends Error {
  /**
   * @param {string} message
   * @param {Error & { code?: unknown, stderr?: string }} cause - as rejected by `execFile`
   */
  constructor(message, cause) {
    super(message, { cause })
    /** @type {string | undefined} set when it only says there is no ufw to drive */
    this.unavailable = unavailabilityOf(cause)
    /** @type {boolean} set when the rule to delete does not exist */
    this.missingRule = MISSING_RULE_RE.test(cause.stderr ?? '')
  }
}

/**
 * ufw drops anything not explicitly allowed, and the ephemeral port of each target cannot be
 * declared in advance. Rules are inserted straight into ufw's own chain: a table of our own could
 * not help, a packet dropped by any chain of the `input` hook is dropped whatever the others say.
 *
 * `iptables`, not `ufw allow`: the rule only lives in the kernel, nothing is written to
 * `/etc/ufw/user.rules`, so a crash cannot leave a permanent hole — at worst one lasting until the
 * next start, which purges them, or the next reboot.
 *
 * Known limit: any change made to ufw (`ufw allow`, `ufw delete`, `ufw reload`, `ufw enable`…)
 * restores its user chains from `user.rules`, which drops these rules and breaks the mounts alive at
 * that time. Accepted: XOA and proxies are appliances, their firewall is not meant to be changed by
 * hand. The mounts made afterwards are not affected.
 */
const UFW = {
  4: { command: 'iptables', chain: 'ufw-user-input' },
  6: { command: 'ip6tables', chain: 'ufw6-user-input' },
}

/**
 * @param {string} scope
 * @returns {string} the comment prefix of the rules of this scope
 */
const commentPrefixOf = scope => `${COMMENT_PREFIX}${scope}:`

/**
 * @param {string} commentPrefix - see `commentPrefixOf`
 * @param {{ source: string, port: number, id: string }} rule
 * @returns {string[]} the rule spec, shared by its insertion and its deletion
 */
const ruleSpec = (commentPrefix, { source, port, id }) => [
  '-s',
  source,
  '-p',
  'tcp',
  '--dport',
  String(port),
  '-m',
  'comment',
  '--comment',
  commentPrefix + id,
  '-j',
  'ACCEPT',
]

// as printed by `iptables -S`, which adds the implicit `-m tcp` and a prefix length to the source:
// -A ufw-user-input -s 10.1.0.5/32 -p tcp -m tcp --dport 42289 -m comment --comment "xo-live-mount:<scope>:<id>" -j ACCEPT
const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const listedRuleRe = commentPrefix =>
  new RegExp(
    `^-A \\S+ -s (\\S+?)(?:/\\d+)? -p tcp -m tcp --dport (\\d+) -m comment --comment "?${escapeRegExp(commentPrefix)}([^"\\s]+)"? -j ACCEPT$`
  )

/**
 * The rules this module inserted for `scope`, from the `iptables -S` output of a chain.
 *
 * @param {string} listing
 * @param {string} scope
 * @returns {{ source: string, port: number, id: string }[]}
 */
export function parseListedRules(listing, scope) {
  const listedRule = listedRuleRe(commentPrefixOf(scope))
  const rules = []
  for (const line of listing.split('\n')) {
    const match = listedRule.exec(line.trim())
    if (match !== null) {
      rules.push({ source: match[1], port: Number(match[2]), id: match[3] })
    }
  }
  return rules
}

/**
 * Open the port of each live mount to the host it is attached to, in ufw.
 *
 * @param {object} [options]
 * @param {string} options.scope - the process the rules belong to (e.g. `xo-server`): only its own are purged
 * @param {(command: string, args: string[]) => Promise<{ stdout: string }>} [options.exec] - injectable for tests only
 */
export function createUfwFirewall({ scope, exec = defaultExec }) {
  const commentPrefix = commentPrefixOf(scope)
  const familyOf = source => UFW[isIPv6(source) ? 6 : 4]

  /** @throws {FirewallCommandError} */
  const run = async (command, args) => {
    try {
      return await exec(command, ['-w', XTABLES_LOCK_WAIT, ...args])
    } catch (error) {
      throw new FirewallCommandError(`${command} ${args.join(' ')} failed`, error)
    }
  }

  return {
    /**
     * @param {{ source: string, port: number, id: string }} rule - `source` is the address of the host
     * @returns {Promise<boolean>} whether a rule was opened, and must be closed: not when there is no ufw to drive
     */
    async open(rule) {
      const { command, chain } = familyOf(rule.source)
      try {
        // inserted first: nothing below may drop it
        await run(command, ['-I', chain, ...ruleSpec(commentPrefix, rule)])
        return true
      } catch (error) {
        if (error.unavailable === undefined) {
          throw error
        }
        // not root: ufw may well be enabled, and would then block the host
        const log = error.unavailable === 'not running as root' ? warn : debug
        log('no firewall rule opened for this live mount', { reason: error.unavailable, ...rule })
        return false
      }
    },

    /** @param {{ source: string, port: number, id: string }} rule - as passed to a successful `open` */
    async close(rule) {
      const { command, chain } = familyOf(rule.source)
      try {
        await run(command, ['-D', chain, ...ruleSpec(commentPrefix, rule)])
      } catch (error) {
        // a change made to ufw dropped it already: what closing it was for
        if (error.unavailable === undefined && !error.missingRule) {
          throw error
        }
        // gone while mounted: the host was locked out, which is what broke this mount if it did
        const log = error.missingRule ? warn : debug
        log('the firewall rule of this live mount was already gone', { reason: error.unavailable, ...rule })
      }
    },

    /**
     * Remove the rules left behind by a previous process, which died without unmounting.
     *
     * @returns {Promise<{ source: string, port: number, id: string }[]>} the removed rules
     */
    async purge() {
      const removed = []
      for (const { command, chain } of Object.values(UFW)) {
        let stdout
        try {
          ;({ stdout } = await run(command, ['-S', chain]))
        } catch (error) {
          if (error.unavailable === undefined) {
            throw error
          }
          // no chain, no rule of ours in it
          debug('no stale firewall rule to look for', { command, reason: error.unavailable })
          continue
        }
        for (const rule of parseListedRules(stdout, scope)) {
          await run(command, ['-D', chain, ...ruleSpec(commentPrefix, rule)])
          removed.push(rule)
        }
      }
      return removed
    },
  }
}
