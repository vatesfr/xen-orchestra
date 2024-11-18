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
You can also check the system logs, [as explained here](https://xen-orchestra.com/docs/troubleshooting.html#cli).
:::

## General

- [Empty page after login](https://xen-orchestra.com/docs/troubleshooting.html#empty-page-after-login)
- [Can't migrate XOA](https://xen-orchestra.com/docs/troubleshooting.html#xoa-migration-issues)
- [Can't boot XOA](https://xen-orchestra.com/docs/troubleshooting.html#xoa-boot-issues)
- [Network issues](https://xen-orchestra.com/docs/troubleshooting.html#network-issues)
- [Out of memory](https://xen-orchestra.com/docs/troubleshooting.html#memory)
- [Transparent proxy and updater](https://xen-orchestra.com/docs/troubleshooting.html#behind-a-transparent-proxy)
- [SSL self-signed certificate expired](https://xen-orchestra.com/docs/troubleshooting.html#updating-ssl-self-signed-certificate)
- [User authentication](https://xen-orchestra.com/docs/authentication.html#debugging)

## Backup troubleshooting

- [Unhealthy VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#unhealthy-vdi-chain)
- [SR_backend_failure_44](https://xen-orchestra.com/docs/backup_troubleshooting.html#srbackendfailure44-insufficient-space)
- [Could not find the base VM](https://xen-orchestra.com/docs/backup_troubleshooting.html#could-not-find-the-base-vm)

## You haven't found a solution here?

Open a ticket concerning your issue on your personal space [here](https://xen-orchestra.com/#!/member/support)
