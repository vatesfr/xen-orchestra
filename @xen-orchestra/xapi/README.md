# @xen-orchestra/xapi

> Layer on top of `xen-api` which brings high level methods to manipulate XAPI
> and XAPI objects.
>
> Note: this library is dedicated for Xen Orchestra use.

## Install

```
npm i \
  @xen-orchestra/xapi \
  xen-api # peer dependency, required to install
```

## Usage

```js
import Xapi from `@xen-orchestra/xapi`

const xapi = new Xapi({
  url: 'https://xen1.company.net',
  auth: {
    user: 'root',
    password: 'important secret password'
  },
})

// will snapshot this VM, automatically handling tasks and quiesced
const snapshotRef = await xapi.vm_snapshot(vmRef)
```
