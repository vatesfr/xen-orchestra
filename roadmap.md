# Xen Orchestra roadmap

Please consider it as an indicative roadmap, things can change.

Item are expressed in a (roughly) decreasing priority order.

## Features

- [Advanced user management](https://xen-orchestra.com/users-roles-in-xen-orchestra/) + ✓ ~~LDAP Backend~~
- ✓ ~~[Backup management](https://github.com/vatesfr/xo-web/issues/176) directly in XOA~~
- ✓ ~~Graphs (RRD) showing CPU, RAM, IO load etc.~~
- ✓ ~~Console working behind a NAT (console proxy in xo-server)~~
- ✓ ~~PCI (and GPU) management in GUI (passthrough)~~
- ✓ ~~Update/upgrade XOA directly in GUI~~
- [D3js](http://d3js.org) data viz **in progress**
- Infrastructure analysis and diag (through whole RRDs recorded)
- Load management (auto migrate if necessary, adapt VM sizing when needed)

## Fixes

- ✓ ~~Better server scalability~~
- ✓ ~~Solve client stability problems~~
- [Resolve known bugs](https://github.com/vatesfr/xo/blob/master/doc/known_bugs/README.md)

## Backlog

This is the non-ordered stuff to put in the roadmap:

- Add PV args and more details in VM creation GUI
- Have CPU per core view
- ✓ ~~VM import and export~~
- ✓ ~~Managing hotfixes directly in XO (with auto search for new updates)~~
- ✓ ~~Autostart VM on a host~~
- ✓ ~~Handle live migration between pools even if there is different CPU types~~
- ✓ ~~Better error messages~~
- ✓ ~~Task progress~~
- ✓ ~~Ability to create storage repositories~~
