import type { VdfDocument, VdfService } from '@/modules/vdf/types.ts'
import {
  declaredKinds,
  documentServiceErrors,
  isEmptyReport,
  isMac,
  serviceErrors,
  serviceGroupChoices,
  servicesOfGroup,
  servicesReport,
  undeclaredLines,
} from '@/modules/vdf/utils/vdf-services.util.ts'
import { describe, expect, it } from 'vitest'

// as the agent's check (agent/policy.go checkServices, vdf#103)
const document: VdfDocument = {
  version: 9,
  groups: {
    dhcp: { tags: ['vdf:service=dhcp'] },
    upstream: { ips: ['192.0.2.1'] },
    tagged: { tags: ['vdf:role=gw'], ips: ['192.0.2.2'] },
    customer: { networks: ['vdf:net=customer'] },
    empty: {},
  },
  policies: [],
}

const service = (fields: Partial<VdfService>): VdfService => ({ name: 's', kind: 'dhcp4', group: 'dhcp', ...fields })

const types = (fields: Partial<VdfService>, others: string[] = []) =>
  serviceErrors(document, service(fields), others).map(error => error.type)

describe('serviceErrors', () => {
  it('accepts a tag group, and addresses with their MACs', () => {
    expect(types({})).toEqual([])
    expect(types({ kind: 'router', group: 'upstream', macs: ['00:16:3e:aa:bb:cc'] })).toEqual([])
    expect(types({ group: 'empty', macs: ['00-16-3E-AA-BB-CC'] })).toEqual([])
    expect(types({ mode: 'monitor' })).toEqual([])
  })

  it('refuses addresses without MACs, even next to tags', () => {
    expect(types({ group: 'upstream' })).toEqual(['mac-required'])
    expect(types({ group: 'tagged' })).toEqual(['mac-required'])
  })

  it('refuses a group on networks alone, or one that selects nothing', () => {
    expect(types({ group: 'customer', macs: ['00:16:3e:aa:bb:cc'] })).toEqual(['networks-only'])
    expect(types({ group: 'empty' })).toEqual(['selects-nothing'])
    expect(types({ group: 'nope' })).toEqual(['unknown-group'])
  })

  it('checks names, kinds and MACs', () => {
    expect(types({ name: '' })).toEqual(['name-required'])
    expect(types({ name: ' s' })).toEqual(['name-required'])
    expect(types({}, ['s'])).toEqual(['name-taken'])
    expect(types({ kind: 'dns' as never })).toEqual(['kind'])
    expect(types({ group: 'upstream', macs: ['00:16:3e:aa:bb'] })).toEqual(['invalid-mac'])
    expect(types({ group: 'upstream', macs: ['01:00:5e:00:00:01'] })).toEqual(['multicast-mac'])
    expect(types({ group: 'upstream', macs: ['00:00:00:00:00:00'] })).toEqual(['multicast-mac'])
    expect(isMac('00:16:3e:aa-bb:cc')).toBe(false)
  })
})

describe('services in a document', () => {
  const withServices: VdfDocument = {
    ...document,
    services: [
      service({ name: 'a' }),
      service({ name: 'a', kind: 'router', mode: 'monitor' }),
      service({ name: 'gw', kind: 'router', group: 'upstream' }),
    ],
  }

  it('reports each service, a second use of a name included', () => {
    expect(
      documentServiceErrors(withServices).map(({ service, errors }) => [service, errors.map(error => error.type)])
    ).toEqual([
      ['a', []],
      ['a', ['name-taken']],
      ['gw', ['mac-required']],
    ])
  })

  it('tells the kinds an enforced service declares, and who uses a group', () => {
    expect(declaredKinds(withServices)).toEqual(['dhcp4', 'router'])
    expect(declaredKinds({ ...withServices, services: [service({ mode: 'monitor' })] })).toEqual([])
    expect(servicesOfGroup(withServices, 'dhcp')).toEqual(['a', 'a'])
  })
})

describe('servicesReport', () => {
  it('merges the hosts: undeclared kinds, sampled sources, notes and bridges', () => {
    const report = servicesReport([
      {
        name: 'h2',
        services: {
          undeclared: ['router', 'dhcp4'],
          seen: [{ kind: 'dhcp4', src: '10.0.0.9', count: 2, last: '2026-10-29T10:00:00Z' }],
          unenforced: ['xenbr1'],
        },
      },
      {
        name: 'h1',
        services: {
          undeclared: ['dhcp4'],
          seen: [
            { kind: 'dhcp4', src: '10.0.0.9', count: 3, last: '2026-10-29T11:00:00Z' },
            { kind: 'router', src: 'fe80::1', count: 1, last: '2026-10-29T09:00:00Z' },
          ],
          notes: ['service "gw": declared MAC 00:16:3e:aa:bb:cc belongs to pool VM "gw"'],
        },
      },
      { name: 'h3', services: undefined },
    ])
    expect(report.undeclared).toEqual([
      { kind: 'dhcp4', hosts: ['h1', 'h2'] },
      { kind: 'router', hosts: ['h2'] },
    ])
    expect(report.seen).toEqual([
      { kind: 'dhcp4', src: '10.0.0.9', count: 5, last: '2026-10-29T11:00:00Z', hosts: ['h1', 'h2'] },
      { kind: 'router', src: 'fe80::1', count: 1, last: '2026-10-29T09:00:00Z', hosts: ['h1'] },
    ])
    expect(report.notes.map(note => note.host)).toEqual(['h1'])
    expect(report.unenforced).toEqual([{ host: 'h2', bridge: 'xenbr1' }])
    expect(isEmptyReport(servicesReport([{ name: 'h', services: undefined }]))).toBe(true)
  })
})

describe('undeclaredLines', () => {
  it('DHCPv4 and DHCPv6 in one line for the same hosts, the router apart', () => {
    expect(
      undeclaredLines([
        { kind: 'dhcp4', hosts: ['h1', 'h2'] },
        { kind: 'dhcp6', hosts: ['h1', 'h2'] },
        { kind: 'router', hosts: ['h1', 'h2'] },
      ])
    ).toEqual({
      lines: [
        { kinds: ['dhcp4', 'dhcp6'], hosts: ['h1', 'h2'] },
        { kinds: ['router'], hosts: ['h1', 'h2'] },
      ],
      pending: [],
    })
    expect(
      undeclaredLines([
        { kind: 'dhcp4', hosts: ['h1'] },
        { kind: 'dhcp6', hosts: ['h1', 'h2'] },
      ]).lines
    ).toEqual([
      { kinds: ['dhcp4'], hosts: ['h1'] },
      { kinds: ['dhcp6'], hosts: ['h1', 'h2'] },
    ])
  })

  it('sets aside the kinds the draft declares', () => {
    expect(
      undeclaredLines(
        [
          { kind: 'dhcp4', hosts: ['h1'] },
          { kind: 'dhcp6', hosts: ['h1'] },
          { kind: 'router', hosts: ['h1'] },
        ],
        ['dhcp4', 'router']
      )
    ).toEqual({ lines: [{ kinds: ['dhcp6'], hosts: ['h1'] }], pending: ['dhcp4', 'router'] })
  })
})

describe('serviceGroupChoices', () => {
  it("the pool's own groups first, no group on networks alone, the first items with the others counted", () => {
    expect(
      serviceGroupChoices({
        'global:admins': { ips: ['192.0.2.1'] },
        customer: { networks: ['vdf:net=customer'] },
        dhcp: { tags: ['vdf:service=dhcp'], ips: ['192.0.2.2', '192.0.2.3', '2001:db8::1'] },
        empty: {},
      })
    ).toEqual([
      { name: 'dhcp', what: ['vdf:service=dhcp', '192.0.2.2'], more: 2 },
      { name: 'empty', what: [], more: 0 },
      { name: 'global:admins', what: ['192.0.2.1'], more: 0 },
    ])
  })
})
