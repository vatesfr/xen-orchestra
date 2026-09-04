# Releases

Xen Orchestra is distributed in two ways: as a turnkey virtual appliance (**XOA**) and **from the sources** on GitHub. Both contain the same Xen Orchestra, including its two web interfaces ([XO 6 and XO 5](xo6/xo6vsxo5.md)), the REST API and the backup engine.

## XOA, the appliance

XOA (**X**en **O**rchestra virtual **A**ppliance) is the pre-installed VM, and the recommended way to run Xen Orchestra:

- everything ready to work, deployed in minutes
- complete QA on every release
- a web [updater](updater.md) with release channels
- bundled remote support capabilities
- extra services (XO Hub, recipes, advanced metrics)
- a secured system (sudo, firewall)

Deploying one is trivial: see the [XOA install section](installation.md#xoa).

:::tip
Whatever your future usage, try XOA first: it is the easiest way to test everything, and the only way to get professional support.
:::

## Release cadence and channels

A new Xen Orchestra release ships **every month**, versioned like `XOA 6.x`. Each release is announced on the [blog](https://xen-orchestra.com/blog/) with its release notes, and every change is tracked in the [changelog](https://github.com/vatesfr/xen-orchestra/blob/master/CHANGELOG.md#changelog).

On XOA you choose between two [release channels](updater.md#release-channel):

- **Stable**: a release that is already one month old, hardened by a month of community feedback and fixes. For production appliances where stability comes first.
- **Latest**: all the newest improvements, QA validated, fresh from the monthly release.

Switching channels is done from the Updates view, without redeploying anything.

## From the sources

Xen Orchestra is fully open source, and you can [install it from the sources](install-from-sources.md). In that case there are no releases to speak of: **stay on `master`**, and update before reporting anything:

<Terminal shell title="xo — updating an installation from the sources">{`
cd xen-orchestra
git pull  # stay on master
yarn && yarn build
`}</Terminal>

:::warning
There is no community support for source installations that are not up to date with `master`.
:::
