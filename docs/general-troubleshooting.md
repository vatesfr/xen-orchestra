# Common errors and troubleshooting

## Recommandation
If you think you have a problem with your XOA, start by typing`xoa check`command in your terminal:   

```
$ xoa check
✔ Node version
✔ Disk space for /var
✔ Disk space for /
✔ XOA version
✔ xo-server config syntax
✔ Appliance registration
✔ Internet connectivity
```  
If the result you have is completely different than that, or if error messages are display, lost packets, etc., you have, indeed, a problem. The next step should be to check in this document if there is an existing troubleshooting for the problem you have. 

> You can also access the log by using this command: `$ tail -f /var/log/syslog` ([learn more](https://xen-orchestra.com/docs/logs.html))

## General

* [Empty page after login](https://xen-orchestra.com/docs/troubleshooting.html#empty-page-after-login)
* [Network issues](https://xen-orchestra.com/docs/troubleshooting.html#network-issues)
* [Out of memory](https://xen-orchestra.com/docs/troubleshooting.html#memory)
* [Transparent proxy and updater](https://xen-orchestra.com/docs/troubleshooting.html#behind-a-transparent-proxy)
* [SSL self-signed certificate expired](https://xen-orchestra.com/docs/troubleshooting.html#updating-ssl-self-signed-certificate)
* [User authentication](https://xen-orchestra.com/docs/authentication.html#debugging)

## Backup troubleshooting

* [Unhealthy VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#unhealthy-vdi-chain)
* [SR_backend_failure_44](https://xen-orchestra.com/docs/backup_troubleshooting.html#srbackendfailure44-insufficient-space)
