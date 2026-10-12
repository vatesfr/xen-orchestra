import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createUfwFirewall, FirewallCommandError, parseListedRules } from './_firewall.mjs'

const ID = 'a4ab6191df76c942459491122ee61fa7'
const SCOPE = 'xo-server'
const RULE_SPEC = [
  '-p',
  'tcp',
  '--dport',
  '42289',
  '-m',
  'comment',
  '--comment',
  `xo-live-mount:${SCOPE}:${ID}`,
  '-j',
  'ACCEPT',
]

const makeExec = (listings = {}) => {
  const calls = []
  const exec = async (command, args) => {
    calls.push([command, ...args])
    if (args.includes('-S')) {
      const listing = listings[command]
      if (listing instanceof Error) {
        throw listing
      }
      return { stdout: listing ?? '' }
    }
    return { stdout: '' }
  }
  return { calls, exec }
}

describe('createUfwFirewall', () => {
  it('inserts the rule on top of ufw-user-input, scoped to the host', async () => {
    const { calls, exec } = makeExec()

    await createUfwFirewall({ scope: SCOPE, exec }).open({ source: '10.1.0.5', port: 42289, id: ID })

    assert.deepEqual(calls, [['iptables', '-w', '5', '-I', 'ufw-user-input', '-s', '10.1.0.5', ...RULE_SPEC]])
  })

  it('deletes the very same rule', async () => {
    const { calls, exec } = makeExec()

    await createUfwFirewall({ scope: SCOPE, exec }).close({ source: '10.1.0.5', port: 42289, id: ID })

    assert.deepEqual(calls, [['iptables', '-w', '5', '-D', 'ufw-user-input', '-s', '10.1.0.5', ...RULE_SPEC]])
  })

  it('uses ip6tables and ufw6-user-input for an IPv6 host', async () => {
    const { calls, exec } = makeExec()

    await createUfwFirewall({ scope: SCOPE, exec }).open({ source: 'fd00::5', port: 42289, id: ID })

    assert.deepEqual(calls, [['ip6tables', '-w', '5', '-I', 'ufw6-user-input', '-s', 'fd00::5', ...RULE_SPEC]])
  })

  it('reports the command which failed, with its cause', async () => {
    const cause = Object.assign(new Error('Command failed'), {
      code: 4,
      stderr: 'Another app is currently holding the xtables lock',
    })
    const exec = async () => {
      throw cause
    }

    await assert.rejects(
      createUfwFirewall({ scope: SCOPE, exec }).open({ source: '10.1.0.5', port: 42289, id: ID }),
      error => {
        assert.ok(error instanceof FirewallCommandError)
        assert.match(error.message, /^iptables -I ufw-user-input .* failed$/)
        assert.equal(error.cause, cause)
        assert.equal(error.unavailable, undefined)
        assert.equal(error.missingRule, false)
        return true
      }
    )
  })

  // enabled by default: an install it cannot apply to must still mount
  for (const [what, failure] of [
    ['iptables is not installed', Object.assign(new Error('spawn iptables ENOENT'), { code: 'ENOENT' })],
    [
      'ufw is not enabled',
      Object.assign(new Error('Command failed'), {
        code: 1,
        stderr: 'iptables: No chain/target/match by that name.\n',
      }),
    ],
    [
      'not running as root',
      Object.assign(new Error('Command failed'), {
        code: 4,
        stderr:
          'iptables v1.8.9 (nf_tables): Could not fetch rule set generation id: Permission denied (you must be root)\n',
      }),
    ],
  ]) {
    it(`opens nothing, without failing, when ${what}`, async () => {
      const exec = async () => {
        throw failure
      }
      const firewall = createUfwFirewall({ scope: SCOPE, exec })

      assert.equal(await firewall.open({ source: '10.1.0.5', port: 42289, id: ID }), false)
      await firewall.close({ source: '10.1.0.5', port: 42289, id: ID })
      assert.deepEqual(await firewall.purge(), [])
    })
  }

  it('reports whether a rule was opened', async () => {
    const { exec } = makeExec()

    assert.equal(
      await createUfwFirewall({ scope: SCOPE, exec }).open({ source: '10.1.0.5', port: 42289, id: ID }),
      true
    )
  })

  it('considers a rule already dropped, e.g. by a change made to ufw, as closed', async () => {
    const exec = async () => {
      throw Object.assign(new Error('Command failed'), {
        code: 1,
        stderr: 'iptables: Bad rule (does a matching rule exist in that chain?).\n',
      })
    }

    await createUfwFirewall({ scope: SCOPE, exec }).close({ source: '10.1.0.5', port: 42289, id: ID })
  })

  it('reports any other failure to close a rule', async () => {
    const cause = Object.assign(new Error('Command failed'), { code: 4, stderr: 'xtables lock timeout' })
    const exec = async () => {
      throw cause
    }

    await assert.rejects(createUfwFirewall({ scope: SCOPE, exec }).close({ source: '10.1.0.5', port: 42289, id: ID }), {
      cause,
    })
  })

  it('purges the families it can, skipping one without ufw', async () => {
    const calls = []
    const exec = async (command, args) => {
      calls.push([command, ...args])
      if (command === 'ip6tables') {
        throw Object.assign(new Error('Command failed'), {
          code: 1,
          stderr: 'ip6tables: No chain/target/match by that name.\n',
        })
      }
      return {
        stdout: `-A ufw-user-input -s 10.1.0.5/32 -p tcp -m tcp --dport 42289 -m comment --comment "xo-live-mount:${SCOPE}:${ID}" -j ACCEPT\n`,
      }
    }

    assert.deepEqual(await createUfwFirewall({ scope: SCOPE, exec }).purge(), [
      { source: '10.1.0.5', port: 42289, id: ID },
    ])
    assert.deepEqual(
      calls.map(([command, , , action]) => [command, action]),
      [
        ['iptables', '-S'],
        ['iptables', '-D'],
        ['ip6tables', '-S'],
      ]
    )
  })

  it('purges only its own rules, not those of another process, in both families', async () => {
    const { calls, exec } = makeExec({
      iptables: [
        '-N ufw-user-input',
        '-A ufw-user-input -p tcp -m tcp --dport 22 -j ACCEPT',
        `-A ufw-user-input -s 10.1.0.5/32 -p tcp -m tcp --dport 42289 -m comment --comment "xo-live-mount:${SCOPE}:${ID}" -j ACCEPT`,
        // another process on the same machine: its mounts are alive
        `-A ufw-user-input -s 10.1.0.6/32 -p tcp -m tcp --dport 42290 -m comment --comment "xo-live-mount:xo-proxy:${ID}" -j ACCEPT`,
      ].join('\n'),
      ip6tables: `-A ufw6-user-input -s fd00::5/128 -p tcp -m tcp --dport 42289 -m comment --comment xo-live-mount:${SCOPE}:${ID} -j ACCEPT\n`,
    })

    const removed = await createUfwFirewall({ scope: SCOPE, exec }).purge()

    assert.deepEqual(removed, [
      { source: '10.1.0.5', port: 42289, id: ID },
      { source: 'fd00::5', port: 42289, id: ID },
    ])
    assert.deepEqual(calls, [
      ['iptables', '-w', '5', '-S', 'ufw-user-input'],
      ['iptables', '-w', '5', '-D', 'ufw-user-input', '-s', '10.1.0.5', ...RULE_SPEC],
      ['ip6tables', '-w', '5', '-S', 'ufw6-user-input'],
      ['ip6tables', '-w', '5', '-D', 'ufw6-user-input', '-s', 'fd00::5', ...RULE_SPEC],
    ])
  })
})

describe('parseListedRules', () => {
  it('ignores the rules it did not insert', () => {
    assert.deepEqual(
      parseListedRules(
        [
          '-A ufw-user-input -p tcp -m tcp --dport 443 -j ACCEPT',
          '-A ufw-user-input -s 10.0.0.0/8 -p tcp -m tcp --dport 3260 -m comment --comment "someone else" -j ACCEPT',
        ].join('\n'),
        SCOPE
      ),
      []
    )
  })
})
