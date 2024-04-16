# Airgap support

:::tip
This page concerns only official XO Appliances, and not XO built from sources.
:::

XO has not been initially developed to support airgapped infrastructures, but the following procedures have been tested and validated to permit its support.

A separate XCP-ng pool with Internet access is necessary, it will be used as a temporary zone to register and upgrade the XOA.

## Deployement

[Follow the standard procedure](https://xen-orchestra.com/docs/installation.html) to deploy the XOA on your pool with Internet access.

Make sure that your appliance is [properly registered](https://xen-orchestra.com/docs/installation.html#registration) and [up-to-date](https://xen-orchestra.com/docs/updater.html).

It's also good to take a quick look at [the XOA check](https://xen-orchestra.com/docs/xoa.html#xoa-check) to detect issues early.

When everything is good, you can shutdown your XOA and export it:

```console
$ xe vm-shutdown uuid=$uuid
$ xe vm-export compress=true uuid=$uuid filename=xoa.xva
Export succeeded
```

> `$uuid` should be replaced by the UUID of your XOA.

Now you need to move the `xoa.xva` file from your connected pool to your airgapped one.

And the last step is to import it in your airgapped pool and start it:

```console
$ xe vm-import filename=xoa.xva
c87a6dc3-9889-acf0-a680-79de3780c08f
$ xe vm-start uuid=c87a6dc3-9889-acf0-a680-79de3780c08f
```

You can now delete the XOA on your connected pool, it is no longer necessary.

## Upgrade

To upgrade your XOA, you need to:

1. shutdown the XOA on your airgapped pool
2. export it to an XVA file
3. move it to your connected pool and import it
4. start it, run the [upgrade process](https://xen-orchestra.com/docs/updater.html)
5. shutdown this XOA
6. export it to an XVA file
7. move it to your airgapped pool and import it
8. start it and check that everything appears correct
9. delete the XOA on your connected pool and the previous XOA on your airgapped pool

For details on the steps, refer to the [_Deployement_ section](#deployement).
