# ChangeLog

## **3.3.0** (2014-03-07)

## Enhancements

- [Grunt](http://gruntjs.com/) has been replaced by [gulp.js](http://gulpjs.com/) ([#91](https://github.com/vatesfr/xo-web/issues/91))
- a host can be detached from a pool ([#98](https://github.com/vatesfr/xo-web/issues/98))
- snapshots management in VM view ([#99](https://github.com/vatesfr/xo-web/issues/99))
- log deletion in VM view ([#100](https://github.com/vatesfr/xo-web/issues/100))

## Bug fixes

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
