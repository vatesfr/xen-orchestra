> This file contains all changes that have not been released yet.

### Enhancements

- [Home] Set description on bulk snapshot [#3925](https://github.com/vatesfr/xen-orchestra/issues/3925) (PR [#3933](https://github.com/vatesfr/xen-orchestra/pull/3933))
- Work-around the XenServer issue when `VBD#VDI` is an empty string instead of an opaque reference (PR [#3950](https://github.com/vatesfr/xen-orchestra/pull/3950))
- [VDI migration] Retry when XenServer fails with `TOO_MANY_STORAGE_MIGRATES` (PR [#3940](https://github.com/vatesfr/xen-orchestra/pull/3940))
- [VM]
  - [General] The creation date of the VM is now visible [#3932](https://github.com/vatesfr/xen-orchestra/issues/3932) (PR [#3947](https://github.com/vatesfr/xen-orchestra/pull/3947))
  - [Disks] Display device name [#3902](https://github.com/vatesfr/xen-orchestra/issues/3902) (PR [#3946](https://github.com/vatesfr/xen-orchestra/pull/3946))
- [VM Snapshotting]
  - Detect and destroy broken quiesced snapshot left by XenServer [#3936](https://github.com/vatesfr/xen-orchestra/issues/3936) (PR [#3937](https://github.com/vatesfr/xen-orchestra/pull/3937))
  - Retry twice after a 1 minute delay if quiesce failed [#3938](https://github.com/vatesfr/xen-orchestra/issues/3938) (PR [#3952](https://github.com/vatesfr/xen-orchestra/pull/3952))

### Bug fixes

- [Import] Fix import of big OVA files
- [Host] Show the host's memory usage instead of the sum of the VMs' memory usage (PR [#3924](https://github.com/vatesfr/xen-orchestra/pull/3924))
- [SAML] Make `AssertionConsumerServiceURL` matches the callback URL
- [Backup NG] Correctly delete broken VHD chains [#3875](https://github.com/vatesfr/xen-orchestra/issues/3875) (PR [#3939](https://github.com/vatesfr/xen-orchestra/pull/3939))
- [Remotes] Don't ignore `mount` options [#3935](https://github.com/vatesfr/xen-orchestra/issues/3935) (PR [#3931](https://github.com/vatesfr/xen-orchestra/pull/3931))

### Released packages

- xen-api v0.24.2
- @xen-orchestra/fs v0.6.1
- xo-server-auth-saml v0.5.3
- xo-server v5.35.0
- xo-web v5.35.0
