# ACL

## Current implementation

An ACL is a trio of:

- an subject which can be:
  - a user identifier
  - an group identifier
- an object identifier
- an action which can be:
  - a high-level action:
    - `view`
    - `operate`: everyday action with side-effects
    - `administrate`: potentially destructive action
  - a role which represent a set of high-level action:
    - `viewer`: `view`
    - `operator`: `view` & `operate`
    - `admin`: `view` & `operate` & `administrate`

ACL are inherited among objects: See https://github.com/vatesfr/xen-orchestra/blob/e2521b668854df971bdae4b80e9bc84ed1effa69/packages/xo-acl-resolver/index.js#L56

## New proposal

### System

1. action can now be a specific API method, prefixed by `api:`, e.g. `api:vm.snapshot`
2. make roles customizable

### UI

1. Only allow creating ACLs on roles instead of actions
2. Discourage creating ACLs on users, encourage groups instead
