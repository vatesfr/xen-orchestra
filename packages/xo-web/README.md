# Xen Orchestra Web [![Chat with us](https://storage.crisp.im/plugins/images/936925df-f37b-4ba8-bab0-70cd2edcb0be/badge.svg)](https://go.crisp.im/chat/embed/?website_id=-JzqzzwddSV7bKGtEyAQ) [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

![](http://i.imgur.com/tRffA5y.png)

XO-Web is part of [Xen Orchestra](https://github.com/vatesfr/xen-orchestra), a web interface for XenServer or XAPI enabled hosts.

It is a web client for [XO-Server](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-server).

---

## Installation

XOA or manual install procedure is [available here](https://xen-orchestra.com/docs/installation.html)

## Compilation

Production build:

```
$ npm run build
```

Development build:

```
$ npm run dev
```

### Environment

#### `NODE_ENV`

Set to _production_ it disables many checks which result in increased
performance.

#### `XOA_PLAN`

- 1: Free
- 2: Starter
- 3: Enterprise
- 4: Premium
- 5: Sources

```js
if (process.env.XOA_PLAN < 5) {
  console.log('included only in XOA')
}

if (process.env.XOA_PLAN > 3) {
  console.log('included only in Premium and Sources')
}
```

## How to report a bug?

Please consider using the [bugtracker](https://github.com/vatesfr/xen-orchestra/issues).

## Process for new release

```bash
# Switch to the stable branch.
git checkout stable

# Fetches latest changes.
git pull --ff-only

# Merge changes of the next-release branch.
git merge next-release

# Increment the version (patch, minor or major).
npm version minor

# Go back to the next-release branch.
git checkout next-release

# Fetches the last changes (the merge and version bump) from stable to
# next-release.
git merge --ff-only stable

# Push the changes on git.
git push --follow-tags origin stable next-release

# Publish this release to npm.
npm publish
```

## License

AGPL3 © [Vates SAS](http://vates.fr)
