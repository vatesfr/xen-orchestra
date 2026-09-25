> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Docker] Manage the Docker containers running in your VMs, over SSH, with nothing to install in the VM: the new XO 6 VM _Containers_ tab lists them (ports, state, uptime, CPU and memory usage, Compose projects), shows their logs, and starts, stops, restarts, pauses, resumes and removes them. Also available in the REST API (`/rest/v0/docker-engines` and `/rest/v0/docker-containers`, administrators only), with an optional raw Docker Engine API passthrough, disabled by default (`[docker] allowRawApi`). The SSH host key of the VM is verified, see the [documentation](https://docs.xen-orchestra.com/manage-your-infrastructure/docker) for the prerequisites. **Note:** the SSH credentials of the Docker engines are equivalent to root access on the VMs, and they are stored in plain text in the database unless `redis.encryptCredentialDatabase` is enabled
### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/obfuscate patch
- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
