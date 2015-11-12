# Updater

The updater is the central piece to get your XOA on the latest bits of Xen Orchestra.

It allows also to transform your current version in any others (Trial, Starter, Enterprise or Premium) **without downloading a new XOA**.

## Requierements

In order to work, the updater needs to access to xen-orchestra.com (port 443).

## Usage

The updater is configurable directly in the web interface, or via the CLI.

### From the web interface

By default for a new XOA, you'll have this icon in the top right:

![](updater_notreg.png)

It means your appliance is not registered. Click on this icon and follow the next step.

#### Register

Updates and trial will be available as soon as you registered your appliance. To register, use your https://xen-orchestra.com credentials you gave to download it previously (your email and your password):

![](updater_reg.png)

#### Upgrade

#### Check for new versions

### From the CLI

If you interface is not accessible, or you just prefer to use CLIs commands, it's totally possible to do all the operations. You need to access your XOA by SSH.

#### Register

#### Upgrade

#### Check for new versions

## Troubleshooting

Connect to your XOA in SSH then:

* you should be able to successfully `ping xen-orchestra.com`
* if not, check your `/etc/resolv.conf` file and modify it if necessary (give a correct DNS server)
* use `ifconfig` to check your network configuration
* check your firewall(s) and allow XOA to reach xen-orchestra.com (port 443)