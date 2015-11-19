# Job manager

> Job manager is released since 4.10

The key idea is to be able to schedule any action (migrate, reboot etc.), like for backups, snapshots or DR.

## Examples

### Save on your electric bill

* plan a live migration on your VMs at 11:00PM on a less powerful host, to shutdown the big one
* start the big server at 6:00AM and migrate back VMs 15 minutes later

### Scale when needed

* schedule the boot of extra-VMs during your usual activity spikes (horizontal scaling)
* also plan more vCPUs or RAM to these VMs at the same time
* go back to the previous state when your planned load is low (e.g: during the night)

### Planned reboot

* your client app is not very stable, or you need to reboot every month after kernel updates: schedule this during the weekend!

### Test DR

* thanks to the DR feature of Xen Orchestra, you can also schedule a boot of your DR'ed VMs: this way, your DR plan can be auto-tested!
