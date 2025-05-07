# Common errors and troubleshooting

## Recommendation

If you think you have a problem with your XOA, start by typing`xoa check`command in your terminal:

```console
$ xoa check
✔ Node version
✔ Disk space for /var
✔ Disk space for /
✔ XOA version
✔ xo-server config syntax
✔ Appliance registration
✔ Internet connectivity
```

If the result you have is completely different from that, or if error messages are displayed, lost packets, etc., you have, indeed, a problem. The next step should be to check in this document if there is an existing troubleshooting for the problem you have.

:::tip
You can also check the system logs, [as explained here](troubleshooting#cli).
:::

## General

- [Empty page after login](troubleshooting#empty-page-after-login)
- [Can't migrate XOA](troubleshooting#xoa-migration-issues)
- [Can't boot XOA](troubleshooting#xoa-boot-issues)
- [Network issues](troubleshooting#network-issues)
- [Out of memory](troubleshooting#memory)
- [Transparent proxy and updater](troubleshooting#behind-a-transparent-proxy)
- [SSL self-signed certificate expired](troubleshooting#updating-ssl-self-signed-certificate)
- [User authentication](authentication#debugging)

## Backup troubleshooting

- [Unhealthy VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#unhealthy-vdi-chain)
- [SR_backend_failure_44](https://xen-orchestra.com/docs/backup_troubleshooting.html#srbackendfailure44-insufficient-space)
- [Could not find the base VM](https://xen-orchestra.com/docs/backup_troubleshooting.html#could-not-find-the-base-vm)

## You haven't found a solution here?

Open a ticket concerning your issue on your personal space [here](https://xen-orchestra.com/#!/member/support)
