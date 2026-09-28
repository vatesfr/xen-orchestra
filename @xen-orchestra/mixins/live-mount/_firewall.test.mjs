import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createUfwFirewall, parseListedRules } from './_firewall.mjs'

const ID = 'a4ab6191df76c942459491122ee61fa7'
const RULE_SPEC = ['-p', 'tcp', '--dport', '42289', '-m', 'comment', '--comment', `xo-live-mount:${ID}`, '-j', 'ACCEPT']

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

    await createUfwFirewall({ exec }).open({ source: '10.1.0.5', port: 42289, id: ID })

    assert.deepEqual(calls, [['iptables', '-w', '5', '-I', 'ufw-user-input', '-s', '10.1.0.5', ...RULE_SPEC]])
  })

  it('deletes the very same rule', async () => {
    const { calls, exec } = makeExec()

    await createUfwFirewall({ exec }).close({ source: '10.1.0.5', port: 42289, id: ID })

    assert.deepEqual(calls, [['iptables', '-w', '5', '-D', 'ufw-user-input', '-s', '10.1.0.5', ...RULE_SPEC]])
  })

  it('uses ip6tables and ufw6-user-input for an IPv6 host', async () => {
    const { calls, exec } = makeExec()

    await createUfwFirewall({ exec }).open({ source: 'fd00::5', port: 42289, id: ID })

    assert.deepEqual(calls, [['ip6tables', '-w', '5', '-I', 'ufw6-user-input', '-s', 'fd00::5', ...RULE_SPEC]])
  })

  it('reports the command which failed, with its cause', async () => {
    const cause = new Error("iptables: Chain 'ufw-user-input' does not exist")
    const exec = async () => {
      throw cause
    }

    await assert.rejects(createUfwFirewall({ exec }).open({ source: '10.1.0.5', port: 42289, id: ID }), error => {
      assert.match(error.message, /^iptables -I ufw-user-input .* failed, is ufw enabled\?$/)
      assert.equal(error.cause, cause)
      return true
    })
  })

  it('purges only its own rules, in both families', async () => {
    const { calls, exec } = makeExec({
      iptables: [
        '-N ufw-user-input',
        '-A ufw-user-input -p tcp -m tcp --dport 22 -j ACCEPT',
        `-A ufw-user-input -s 10.1.0.5/32 -p tcp -m tcp --dport 42289 -m comment --comment "xo-live-mount:${ID}" -j ACCEPT`,
      ].join('\n'),
      ip6tables: `-A ufw6-user-input -s fd00::5/128 -p tcp -m tcp --dport 42289 -m comment --comment xo-live-mount:${ID} -j ACCEPT\n`,
    })

    const removed = await createUfwFirewall({ exec }).purge()

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
        ].join('\n')
      ),
      []
    )
  })
})
