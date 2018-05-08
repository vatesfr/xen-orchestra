
# Xen Orchestra

## Introduction

Welcome to the official Xen Orchestra (XO) documentation.

XO is a web interface to visualize and administer your XenServer (or XAPI enabled) hosts. **No agent** is required for it to work.

It aims to be easy to use on any device supporting modern web technologies (HTML 5, CSS 3, JavaScript), such as your desktop computer or your smartphone.

![](https://pbs.twimg.com/profile_images/601775622675898368/xWbbafyO_400x400.png)

## XOA quick deploy

SSH to your XenServer, and execute the following:

```
bash -c "$(curl -s http://xoa.io/deploy)"
```

### XOA credentials

* Web UI: `admin@admin.net` / `admin`
* Console/SSH: `xoa` / `xoa` (first login)

## Must read

* [XOA installation](xoa.md)
* [Main features](features.md)
* [Pro Support](support.md)
