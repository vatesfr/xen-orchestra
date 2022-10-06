# ACL System v2

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
  - a specific API method, prefixed by `api:`, e.g. `api:vm.snapshot`

## Inheritance for objects

See https://github.com/vatesfr/xen-orchestra/blob/e2521b668854df971bdae4b80e9bc84ed1effa69/packages/xo-acl-resolver/index.js#L56
