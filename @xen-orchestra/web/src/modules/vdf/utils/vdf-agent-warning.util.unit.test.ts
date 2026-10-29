import { parseAgentWarning } from '@/modules/vdf/utils/vdf-agent-warning.util.ts'
import { describe, expect, it } from 'vitest'

// the texts as the agent writes them (agent/policy.go, ports.go, xapi.go)
describe('parseAgentWarning', () => {
  it('reads a default pass in the last tier', () => {
    expect(
      parseAgentWarning(`policy "app-out": default pass in the document's last tier (application) allows`)
    ).toEqual({ type: 'default-pass-last-tier', policy: 'app-out', tier: 100 })
  })

  it('reads a pass rule in the last tier', () => {
    expect(parseAgentWarning(`policy "web" rule 12: pass in the document's last tier (baseline) allows`)).toEqual({
      type: 'rule-pass-last-tier',
      policy: 'web',
      rule: 12,
      tier: 110,
    })
  })

  it('reads a default allow before the application tier, inbound and outbound', () => {
    const ends = 'ends evaluation, later tiers (and their drops) never see what it allows'

    expect(parseAgentWarning(`policy "global:ssh": default allow in tier securityops ${ends}`)).toEqual({
      type: 'default-allow-early',
      policy: 'global:ssh',
      tier: 25,
    })
    expect(parseAgentWarning(`policy "dns": egress default allow in tier 60 ${ends}`)).toEqual({
      type: 'egress-default-allow-early',
      policy: 'dns',
      tier: 60,
    })
  })

  it('reads the rule warnings', () => {
    expect(parseAgentWarning('policy "web" rule 3: pass rules decide nothing, log ignored')).toEqual({
      type: 'pass-log-ignored',
      policy: 'web',
      rule: 3,
    })
    expect(parseAgentWarning('policy "web" rule 3: port range 1-65535 is every port, the same as no ports')).toEqual({
      type: 'every-port',
      policy: 'web',
      rule: 3,
    })
    expect(parseAgentWarning('policy "web" rule 3: ports 80-90 and 85 overlap')).toEqual({
      type: 'ports-overlap',
      policy: 'web',
      rule: 3,
      first: '80-90',
      second: '85',
    })
    expect(
      parseAgentWarning(
        'policy "db" rule 2: id already used in policy "web", hits and connections are attributed to both'
      )
    ).toEqual({ type: 'duplicate-rule-id', policy: 'db', rule: 2, other: 'web' })
  })

  it('reads the warnings about older agents', () => {
    expect(
      parseAgentWarning(
        'groups scoped to networks: agents before per-network groups keep enforcing their last policy, or enforce nothing if they never had one (their hosts show up as enforcing no document)'
      )
    ).toEqual({ type: 'networks-old-agents' })
    expect(
      parseAgentWarning(
        'egress rules: agents before egress keep enforcing their last policy, or enforce nothing if they never had one (a publish forced past hosts lacking egress gives them its ingress only)'
      )
    ).toEqual({ type: 'egress-old-agents' })
    expect(
      parseAgentWarning(
        'host "xcp \\"b\\"" (agent spike-1, formats up to 3 as far as its status tells) doesn\'t record monitor mode: its monitored policies are left out there, the rules it enforces are the same'
      )
    ).toEqual({ type: 'monitor-old-agent', host: 'xcp "b"', agent: 'spike-1', version: 3 })
    expect(
      parseAgentWarning(
        'port ranges cover more than 4096 ports in all, too many to list port by port: agents before port ranges keep enforcing their last policy'
      )
    ).toEqual({ type: 'port-ranges-old-agents', max: 4096 })
  })

  it('unquotes names as Go quotes them', () => {
    expect(
      parseAgentWarning(String.raw`policy "say \"hi\"": default pass in the document's last tier (application) allows`)
    ).toMatchObject({ policy: 'say "hi"' })
  })

  it('leaves other texts alone', () => {
    expect(parseAgentWarning('ignored: json: unknown field "teir"')).toBeUndefined()
    expect(parseAgentWarning(`policy "app": default pass in the document's last tier (application) allows more`)).toBe(
      undefined
    )
  })
})
