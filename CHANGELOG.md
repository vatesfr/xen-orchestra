# ChangeLog

## **3.5.0** (2014-08-14)

*[XO-Web](https://www.npmjs.org/package/xo-web) and [XO-Server](https://www.npmjs.org/package/xo-server) are now available as npm packages!*

### Enhancements

- XO-Server published on npm ([#26](https://github.com/vatesfr/xo-server/issues/26))
- XO-Server config is now in `/etc/xo-server/config.yaml` ([#33](https://github.com/vatesfr/xo-server/issues/33))
- paths in XO-Server's config are now relative to the config file ([#19](https://github.com/vatesfr/xo-server/issues/19))
- use the Linux icon for Fedora ([#131](https://github.com/vatesfr/xo-web/issues/131))
- start/stop/reboot buttons on console page ([#121](https://github.com/vatesfr/xo-web/issues/121))
- settings page now only accessible to admin ([#77](https://github.com/vatesfr/xo-web/issues/77))
- redirection to the home page when a VM is deleted from its own page ([#56](https://github.com/vatesfr/xo-web/issues/56))
- XO-Web published on npm ([#123](https://github.com/vatesfr/xo-web/issues/123))
- buid process now use Browserify (([#125](https://github.com/vatesfr/xo-web/issues/125), [#135](https://github.com/vatesfr/xo-web/issues/135)))
- view are now written in Jade instead of HTML ([#124](https://github.com/vatesfr/xo-web/issues/124))
- CSS autoprefixer to improve compatibility ([#132](https://github.com/vatesfr/xo-web/issues/132), [#137](https://github.com/vatesfr/xo-web/issues/137))

### Bug fixes

- force shutdown does not attempt a clean shutdown first anymore ([#29](https://github.com/vatesfr/xo-server/issues/29))
- shutdown hosts are now correctly reported as such ([#31](https://github.com/vatesfr/xo-web/issues/31))
- incorrect VM metrics ([#54](https://github.com/vatesfr/xo-web/issues/54), [#68](https://github.com/vatesfr/xo-web/issues/68), [#108](https://github.com/vatesfr/xo-web/issues/108))
- an user cannot delete itself ([#104](https://github.com/vatesfr/xo-web/issues/104))
- in VM creation, required fields are now marked as such ([#113](https://github.com/vatesfr/xo-web/issues/113), [#114](https://github.com/vatesfr/xo-web/issues/114))

## **3.4.0** (2014-05-22)

*Highlight in this release is the new events system between XO-Web
and XO-Server which results in less bandwidth consumption as well as
better performance and reactivity.*

### Enhancements

- events system between XO-Web and XO-Server ([#52](https://github.com/vatesfr/xo-web/issues/52))
- ability to clone/copy a VM ([#116](https://github.com/vatesfr/xo-web/issues/116))
- mandatory log in page ([#120](https://github.com/vatesfr/xo-web/issues/120))

### Bug fixes

- failure in VM creation ([#111](https://github.com/vatesfr/xo-web/issues/111))

## **3.3.1** (2014-03-28)

### Enhancements

- console view is now prettier ([#92](https://github.com/vatesfr/xo-web/issues/92))

### Bug fixes

- VM creation fails to incorrect dependencies ([xo-server/#24](https://github.com/vatesfr/xo-server/issues/24))
- VDIs list in SR view is blinking ([#109](https://github.com/vatesfr/xo-web/issues/109))

## **3.3.0** (2014-03-07)

### Enhancements

- [Grunt](http://gruntjs.com/) has been replaced by [gulp.js](http://gulpjs.com/) ([#91](https://github.com/vatesfr/xo-web/issues/91))
- a host can be detached from a pool ([#98](https://github.com/vatesfr/xo-web/issues/98))
- snapshots management in VM view ([#99](https://github.com/vatesfr/xo-web/issues/99))
- log deletion in VM view ([#100](https://github.com/vatesfr/xo-web/issues/100))

### Bug fixes

- *Snapshot* not working in VM view ([#95](https://github.com/vatesfr/xo-web/issues/95))
- Host *Reboot*/*Restart toolstack*/*Shutdown* not working in main view ([#97](https://github.com/vatesfr/xo-web/issues/97))
- Bower cannot install `angular` automatically due to a version conflict ([#101](https://github.com/vatesfr/xo-web/issues/101))
- Bower installs an incorrect version of `angular-animate` ([#102](https://github.com/vatesfr/xo-web/issues/102))

## **3.2.0** (2014-02-21)

### Enhancements

- dependencies' versions should be fixed to ease deployment ([#93](https://github.com/vatesfr/xo-web/issues/93))
- badges added to the README to see whether dependencies are up to date ([#90](https://github.com/vatesfr/xo-web/issues/90))
- an error notification has been added when the connection to XO-Server failed ([#89](https://github.com/vatesfr/xo-web/issues/89))
- in host view, there is now a link to the host console ([#87](https://github.com/vatesfr/xo-web/issues/87))
- in VM view, deleting a disk requires a confirmation ([#85](https://github.com/vatesfr/xo-web/issues/85))
- the VM and console icons are now different ([#80](https://github.com/vatesfr/xo-web/issues/80))

### Bug fixes

- consoles now work in Google Chrome \o/ ([#46](https://github.com/vatesfr/xo-web/issues/46))
- in host view, many buttons were not working ([#79](https://github.com/vatesfr/xo-web/issues/79))
- in main view, incorrect icons were fixes ([#81](https://github.com/vatesfr/xo-web/issues/81))
- MAC addresses should not be ignored during VM creation ([#94](https://github.com/vatesfr/xo-web/issues/94))

## **3.1.0** (2014-02-14)

### Enhancements

- in VM view, interfaces' network should be displayed ([#64](https://github.com/vatesfr/xo-web/issues/64))
- middle-click or `Ctrl`+click should open new windows (even on pseudo-links) ([#66](https://github.com/vatesfr/xo-web/issues/66))
- lists should use natural sorting (e.g. *VM 2* before *VM 10*) ([#69](https://github.com/vatesfr/xo-web/issues/69))

### Bug fixes

- consoles are not implemented for hosts ([#57](https://github.com/vatesfr/xo-web/issues/57))
- it makes no sense to remove a stand-alone host from a pool (58)
- in VM view, the migrate button is not working ([#59](https://github.com/vatesfr/xo-web/issues/59))
- pool and host names overflow their box in the main view ([#63](https://github.com/vatesfr/xo-web/issues/63))
- in host view, interfaces incorrectly named *networks* and VLAN not shown ([#70](https://github.com/vatesfr/xo-web/issues/70))
- VM suspended state is not properly handled ([#71](https://github.com/vatesfr/xo-web/issues/71))
- unauthenticated users should not be able to access to consoles ([#73](https://github.com/vatesfr/xo-web/issues/73))
- incorrect scroll (under the navbar) when the view changes ([#74](https://github.com/vatesfr/xo-web/issues/74))
