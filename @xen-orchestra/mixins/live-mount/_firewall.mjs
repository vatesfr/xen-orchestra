import { execFile } from 'node:child_process'
import { isIPv6 } from 'node:net'
import { promisify } from 'node:util'

// every rule is tagged with this prefix, so the ones a crash left behind can be found again
const COMMENT_PREFIX = 'xo-live-mount:'

// external command: never let a stuck `iptables` hang a mount
const EXEC_TIMEOUT = 30e3

// how long `iptables` waits for the xtables lock, held by any other process editing the rules
const XTABLES_LOCK_WAIT = '5'

const execFileAsync = promisify(execFile)
const defaultExec = (command, args) => execFileAsync(command, args, { timeout: EXEC_TIMEOUT })

/**
 * ufw drops anything not explicitly allowed, and the ephemeral port of each target cannot be
 * declared in advance. Rules are inserted straight into ufw's own chain: a table of our own could
 * not help, a packet dropped by any chain of the `input` hook is dropped whatever the others say.
 *
 * `iptables`, not `ufw allow`: the rule only lives in the kernel, nothing is written to
 * `/etc/ufw/user.rules`, so a crash cannot leave a permanent hole — at worst one lasting until the
 * next start, which purges them, or the next reboot.
 *
 * Known limit: `ufw reload` rebuilds ufw's chains and drops these rules, which breaks the mounts
 * alive at that time.
 */
const UFW = {
  4: { command: 'iptables', chain: 'ufw-user-input' },
  6: { command: 'ip6tables', chain: 'ufw6-user-input' },
}

/**
 * @param {{ source: string, port: number, id: string }} rule
 * @returns {string[]} the rule spec, shared by its insertion and its deletion
 */
const ruleSpec = ({ source, port, id }) => [
  '-s',
  source,
  '-p',
  'tcp',
  '--dport',
  String(port),
  '-m',
  'comment',
  '--comment',
  COMMENT_PREFIX + id,
  '-j',
  'ACCEPT',
]

// as printed by `iptables -S`, which adds the implicit `-m tcp` and a prefix length to the source:
// -A ufw-user-input -s 10.1.0.5/32 -p tcp -m tcp --dport 42289 -m comment --comment "xo-live-mount:<id>" -j ACCEPT
const LISTED_RULE_RE = new RegExp(
  `^-A \\S+ -s (\\S+?)(?:/\\d+)? -p tcp -m tcp --dport (\\d+) -m comment --comment "?${COMMENT_PREFIX}([^"\\s]+)"? -j ACCEPT$`
)

/**
 * The rules this module inserted, from the `iptables -S` output of a chain.
 *
 * @param {string} listing
 * @returns {{ source: string, port: number, id: string }[]}
 */
export function parseListedRules(listing) {
  const rules = []
  for (const line of listing.split('\n')) {
    const match = LISTED_RULE_RE.exec(line.trim())
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
 * @param {(command: string, args: string[]) => Promise<{ stdout: string }>} [options.exec] - injectable for tests only
 */
export function createUfwFirewall({ exec = defaultExec } = {}) {
  const familyOf = source => UFW[isIPv6(source) ? 6 : 4]

  const run = async (command, args) => {
    try {
      return await exec(command, ['-w', XTABLES_LOCK_WAIT, ...args])
    } catch (error) {
      const wrapped = new Error(`${command} ${args.join(' ')} failed, is ufw enabled?`)
      wrapped.cause = error
      throw wrapped
    }
  }

  return {
    /**
     * @param {{ source: string, port: number, id: string }} rule - `source` is the address of the host
     */
    async open(rule) {
      const { command, chain } = familyOf(rule.source)
      // inserted first: nothing below may drop it
      await run(command, ['-I', chain, ...ruleSpec(rule)])
    },

    /** @param {{ source: string, port: number, id: string }} rule - as passed to `open` */
    async close(rule) {
      const { command, chain } = familyOf(rule.source)
      await run(command, ['-D', chain, ...ruleSpec(rule)])
    },

    /**
     * Remove the rules left behind by a previous process, which died without unmounting.
     *
     * @returns {Promise<{ source: string, port: number, id: string }[]>} the removed rules
     */
    async purge() {
      const removed = []
      for (const { command, chain } of Object.values(UFW)) {
        const { stdout } = await run(command, ['-S', chain])
        for (const rule of parseListedRules(stdout)) {
          await run(command, ['-D', chain, ...ruleSpec(rule)])
          removed.push(rule)
        }
      }
      return removed
    },
  }
}
