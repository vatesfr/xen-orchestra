# Xen Orchestra roadmap

Please consider it as an indicative roadmap, things can change.

Item are expressed in a (roughly) decreasing priority order.

## Features

- [Advanced user management](https://xen-orchestra.com/users-roles-in-xen-orchestra/) + LDAP Backend
- VM import and export
- Graphs (RRD) showing CPU, RAM, IO load etc.
- Console working behind a NAT (console proxy in xo-server)
- Managing hotfixes directly in XO
- GPU management (passthrough)
- [D3js](http://d3js.org) data viz
- Infrastructure analysis and diag (through whole RRDs recorded)
- Load management (auto migrate if necessary, adapt VM sizing when needed)

## Fixes

- Better server scalability
- Solve client stability problems
- [Resolve known bugs](./known-bugs.md)

## Backlog

This is the non-ordered stuff to put in the roadmap:

- Have CPU per core view
- Handle live migration between pools even if there is different CPU types
- Add PV args and more details in VM creation GUI
- Better error message
- Task progress
- Ability to create local storage

**Work in progress: this document will be updated soon**
