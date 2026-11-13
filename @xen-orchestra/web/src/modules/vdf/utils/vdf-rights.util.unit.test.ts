import {
  firewallActionsForTag,
  firewallRightsOf,
  missingFirewallAction,
  type VdfFirewallRights,
} from '@/modules/vdf/utils/vdf-rights.util.ts'
import { RemoteResourceFetchError } from '@core/packages/remote-resource/remote-resource-fetch.error.ts'
import { describe, expect, it } from 'vitest'

const NONE: VdfFirewallRights = {
  read: false,
  publish: false,
  membership: false,
  'quarantine:add': false,
  'quarantine:remove': false,
}

const ALL: VdfFirewallRights = {
  read: true,
  publish: true,
  membership: true,
  'quarantine:add': true,
  'quarantine:remove': true,
}

describe('firewallRightsOf', () => {
  it("takes the policy answer's rights", () => {
    const rights = { read: true, publish: false, membership: false, 'quarantine:add': true, 'quarantine:remove': true }

    expect(firewallRightsOf({ rights, canEdit: false })).toEqual(rights)
  })

  it('counts an action the answer leaves out as not allowed', () => {
    expect(firewallRightsOf({ rights: { read: true } })).toEqual({ ...NONE, read: true })
  })

  it('gives no right when the policy route refuses the user (403)', () => {
    const error = new RemoteResourceFetchError({ status: 403, statusText: 'Forbidden' })

    expect(firewallRightsOf(undefined, error)).toEqual(NONE)
    // a previous answer doesn't count any more
    expect(firewallRightsOf({ rights: ALL }, error)).toEqual(NONE)
  })

  it("keeps the last answer's rights on another failure", () => {
    const error = new RemoteResourceFetchError({ status: 502, statusText: 'Bad Gateway' })

    expect(firewallRightsOf({ rights: ALL }, error)).toEqual(ALL)
    expect(firewallRightsOf(undefined, new Error('Network down'))).toBeUndefined()
  })

  it("doesn't know them before an answer", () => {
    expect(firewallRightsOf(undefined)).toBeUndefined()
  })

  it('reads an older plugin, without rights, from canEdit (the administrate permission)', () => {
    expect(firewallRightsOf({ canEdit: true })).toEqual(ALL)
    expect(firewallRightsOf({ canEdit: false })).toEqual({ ...NONE, read: true })
    expect(firewallRightsOf({})).toBeUndefined()
  })
})

describe('firewallActionsForTag', () => {
  it('takes membership for a group tag on a VM', () => {
    expect(firewallActionsForTag('add', 'vdf:role=app')).toEqual(['membership'])
    expect(firewallActionsForTag('remove', 'vdf:env=prod', 'VM')).toEqual(['membership'])
  })

  it('takes quarantine:add to quarantine a VM, quarantine:remove to lift it', () => {
    expect(firewallActionsForTag('add', 'vdf:quarantine')).toEqual(['quarantine:add'])
    expect(firewallActionsForTag('remove', 'vdf:quarantine')).toEqual(['quarantine:remove'])
  })

  it('takes publish for any tag on a network', () => {
    for (const tag of ['vdf:net=dmz', 'vdf:unprotected', 'vdf:role=app', 'vdf:quarantine']) {
      expect(firewallActionsForTag('add', tag, 'network')).toEqual(['publish'])
      expect(firewallActionsForTag('remove', tag, 'network')).toEqual(['publish'])
    }
  })

  it('takes membership and publish for a network tag on a VM', () => {
    expect(firewallActionsForTag('add', 'vdf:net=dmz')).toEqual(['membership', 'publish'])
    expect(firewallActionsForTag('remove', 'vdf:unprotected')).toEqual(['membership', 'publish'])
  })
})

describe('missingFirewallAction', () => {
  it('is the first action the user may not do', () => {
    expect(missingFirewallAction({ ...ALL, publish: false }, ['membership', 'publish'])).toBe('publish')
    expect(missingFirewallAction(NONE, ['membership', 'publish'])).toBe('membership')
    expect(missingFirewallAction(ALL, ['membership', 'publish'])).toBeUndefined()
  })

  it('is none while the rights are not known', () => {
    expect(missingFirewallAction(undefined, ['publish'])).toBeUndefined()
  })
})
