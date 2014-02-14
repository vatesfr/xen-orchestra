# ChangeLog

## **3.1.0** (2014-02-14)

### Enhancements

- in VM view, interfaces' network should be displayed (#64)
- middle-click or `Ctrl`+click should open new windows (even on pseudo-links) (#66).
- lists should use natural sorting (e.g. *VM 2* before *VM 10*) (#69)

### Bug fixes

- consoles are not implemented for hosts (#57)
- it makes no sense to remove a stand-alone host from a pool (58)
- in VM view, the migrate button is not working (#59)
- pool and host names overflow their box in the main view (#63)
- in host view, interfaces incorrectly named *networks* and VLAN not shown (#70)
- VM suspended state is not properly handled (#71)
- unauthenticated users should not be able to access to consoles (#73)
- incorrect scroll (under the navbar) when the view changes (#74)
