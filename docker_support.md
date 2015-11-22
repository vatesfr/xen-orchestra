# Docker support

> This feature is available since 4.10

Basic container lifecycle is documented [in the Administration section](https://xen-orchestra.com/docs/administration.html#docker-management).

This category is dedicated on creating VM with Docker support.

## Prerequisite

* XenServer 6.5
* Plugin installation (see below)
* CoreOS ISO ([download it here](http://stable.release.core-os.net/amd64-usr/current/coreos_production_iso_image.iso)) for CoreOS installations
* Xen Orchestra 4.10 or newer

## Docker plugin installation

This first step is needed until Docker is supported nativly in the XenServer API (XAPI).

> The plugin should be installed in every hosts, even if they are on the same pool.

1. SSH on your XenServer
1. Download the plugin: `wget http://downloadns.citrix.com.edgesuite.net/10343/XenServer-6.5.0-SP1-xscontainer.iso`
1. Install it: `xe-install-supplemental-pack XenServer-6.5.0-SP1-xscontainer.iso`

That's it! You are ready for enjoying Docker support!

## Docker managed VMs

There is two ways to use the newest exposed Docker features:

* install a CoreOS VM
* transform an existing VM in supported Docker VM

### CoreOS

[CoreOS](https://coreos.com/) is a Linux distribution with bundled software, like `etcd`, `rkt`, `fleet` etc. The ISO install CD is also using `CloudInit` (which is the interesting thing here).

![](https://xen-orchestra.com/blog/content/images/2015/11/coreos-logo.png)

#### Create the VM

First thing first, create a new VM as usual:

![](https://xen-orchestra.com/blog/content/images/2015/11/createvm.png)

Then, select the "CoreOS" template in the list and name it as you want:

![](https://xen-orchestra.com/blog/content/images/2015/11/coreostemplate.png)

Select the [CoreOS ISO](http://stable.release.core-os.net/amd64-usr/current/coreos_production_iso_image.iso) as source for the installation:

![](https://xen-orchestra.com/blog/content/images/2015/11/coreosiso.png)

You will also notice Cloud Config panel:

![](https://xen-orchestra.com/blog/content/images/2015/11/cloudconfig.png)

You'll have to uncomment the line:

`# - ssh-rsa <Your public key>`

And replace it with your actual SSH public key:

`- ssh-rsa AAAA....kuGgQ me@mypc`


The rest of the configuration is identical to any other VM. Just click on "Create VM" and you are done:

![](https://xen-orchestra.com/blog/content/images/2015/11/createdockereadyvm.png)

Your VM is now ready. Nothing else to do. You can see it thanks to the ship logo in the main view:

![](https://xen-orchestra.com/blog/content/images/2015/11/dockerenable.png)

But also in the VM view, you'll have a Docker panel:

![](https://xen-orchestra.com/blog/content/images/2015/11/dockerpanel.png)

It's empty, for sure, because you don't have any Docker container running. So now, let's boot the VM, and create some Docker containers!

You should be able to access the VM with the user `core` and your SSH key (so no password to write!). Oh and the good news: because Xen tools are installed automatically, you already have the IP address displayed in Xen Orchetra:

![](https://xen-orchestra.com/blog/content/images/2015/11/dockerip.png)

So in our example (use the `core` user):

```
me@mypc $ ssh core@192.168.100.209

The authenticity of host '192.168.100.209 (192.168.100.209)' can't be established.
ED25519 key fingerprint is SHA256:NDOQgOqUm3J2ZsBEMNFCpXE1lTsu4DKqKN6H7YcxS3k.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.100.209' (ED25519) to the list of known hosts.
Last login: Sun Nov 22 21:00:05 2015
CoreOS stable (607.0.0)
Update Strategy: No Reboots

core@core1 ~ $ 
```

You are now connected! Let's make some tests before installing it on the disks.

```
core@core1 ~ $ docker run --name hello -d busybox /bin/sh -c "while true; do echo Hello World; sleep 1; done"
Unable to find image 'busybox:latest' locally
Pulling repository busybox
17583c7dd0da: Download complete 
d1592a710ac3: Download complete 
Status: Downloaded newer image for busybox:latest
150bc05a84971489b2dd5dc99fe0169cdbd23599d6fac55a6a8756a3c6f52853

```

Guess what? Check in Xen Orchestra, in the VM view:

![](https://xen-orchestra.com/blog/content/images/2015/11/dockerlist.png)

You can now "cycle" this container: stop, pause or reboot it!

#### CoreOS installation

Now it works, you can make a persistent installation of your CoreOS VM. In the same SSH terminal used before, just type:

```
core@core1 ~ $ sudo coreos-install -d /dev/xvda -o xen -C stable
```

You should have this output:

```
Downloading the signature for http://stable.release.core-os.net/amd64-usr/607.0.0/coreos_production_xen_image.bin.bz2...
...
Downloading, writing and verifying coreos_production_xen_image.bin.bz2...
Success! CoreOS stable 607.0.0 (xen) is installed on /dev/xvda
```

You can reboot the VM and even eject the CoreOS ISO: it will boot as a normal VM now!

### How it works

During the VM creation, the XSContainer plugin will create an extra disk: "Automatic Config Drive", with a size of 2MB. This is where the necessary configuration you edited previously (with the SSH key) is passed to the CoreOS VM! In fact, it uses `CloudInit`.

#### What is CloudInit?

`CloudInit` is a software created to simplify VM provisioning for Cloud instances: it was originally developed for the Amazon Cloud, but works with all major Cloud ready systems, like OpenStack for example.

Basically, it reads configuration during the boot, allowing:

* SSH keys management for newly created VM/instances
* Root disk filesystem growing
* User/group management
* Arbitrary commands execution (system update, custom scripts etc.)

In our case, it's used by the XSContainer plugin to allow host communication to the Docker daemon running in the VM, thus exposing Docker commands outside it.

### Existing VMs

You can also use the XSContainer plugin to "transform" an existing VM into a "Docker" managed one.

You need to have this installed inside the VM:

* Docker
* openssh-server
* ncat

For Debian/Ubuntu like distro: `apt-get install docker.io openssh-server nmap`. For RHEL and derived (CentOS...): `yum install docker openssh-server nmap-ncat`.

To use Docker as non-root, please add the user you want inside the "Docker" group.

Now, you need to access to your host (Dom0) and use the following command:

```
xscontainer-prepare-vm -v <VM_UUID> -u <username>
```

> Because "prepare-vm" is not exposed outside the Dom0 (yet?), we can't use Xen Orchestra to give you a one-click solution so far.
