### Check list

> Check if done, if not relevant leave unchecked.

- [ ] PR reference the relevant issue (e.g. `Fixes #007` or `See xoa-support#42`)
- [ ] if UI changes, a screenshot has been added to the PR
- [ ] documentation updated
- `CHANGELOG.unreleased.md`:
  - [ ] enhancement/bug fix entry added
  - [ ] list of packages to release updated (`${name} v${new version}`)
- **I have tested added/updated features** (and impacted code)
  - [ ] unit tests (e.g. [`cron/parse.spec.js`](https://github.com/vatesfr/xen-orchestra/blob/b24400b21de1ebafa1099c56bac1de5c988d9202/%40xen-orchestra/cron/src/parse.spec.js))
  - [ ] if `xo-server` API changes, the corresponding test has been added to/updated on [`xo-server-test`](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-server-test)
  - [ ] at least manual testing

### Process

1. create a PR as soon as possible
1. mark it as `WiP:` (Work in Progress) if not ready to be merged
1. when you want a review, add a reviewer (and only one)
1. if necessary, update your PR, and re- add a reviewer

From [_the Four Agreements_](https://en.wikipedia.org/wiki/Don_Miguel_Ruiz#The_Four_Agreements):

1. Be impeccable with your word.
1. Don't take anything personally.
1. Don't make assumptions.
1. Always do your best.
