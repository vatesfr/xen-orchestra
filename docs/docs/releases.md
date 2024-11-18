# Releases

Xen Orchestra is distributed in 2 ways:

1. Through XOA
2. "as is" from GitHub

XOA (**X**en **O**rchestra virtual **A**ppliance) is the pre-installed VM with:

- everything ready to work
- complete QA (tested) to guarantee it will work
- a web updater
- bundled remote support capabilities
- extra services (XO Hub, XO Recipies, Advanced metrics, XOSAN…)
- secured system (sudo, firewall)

It's really trivial to deploy it, as you can see [in the XOA install section](installation.md#xoa).

:::tip
In any case, we suggest that you try XOA first, regardless your future usage. It's the easiest way to test everything!
:::

## XOA updates

See the [updates dedicated section](updater.md) to learn how to keep your XOA up to date.

## Github updates

If you decide to install it [from the sources](installation.md#from-the-sources), please **always** try to stick to `master` as possible. Before opening any bug report or topic on the forum, update to the latest commit.

Because you cloned the repository on `master`, just `git pull`!

:::warning
There's no community support on XO installations that aren't up to date to `master`.
:::
