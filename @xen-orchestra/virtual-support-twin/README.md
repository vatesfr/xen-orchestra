<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/virtual-support-twin

> Throwaway Xen Orchestra container loaded with a support bundle

## Usage

Throwaway container to debug a support bundle, exported with `POST /rest/v0/xoa/support-bundle`: the Xen Orchestra of a local checkout is started empty, then loaded with the bundle.

XO is not built in the image: build the branch to debug on the host as usual (`yarn && yarn build`), the image only provides the runtime (Node.js, Redis) and the checkout is mounted read-only.

### Building the image

From this directory, with the Node.js major used to build XO on the host (default: 24), for its native modules:

```sh
docker build -t virtual-support-twin --build-arg NODE_VERSION=24 .
```

### Loading a bundle

From the root of the built checkout:

```sh
docker run --rm --init -p 8080:80 \
  -v .:/opt/xen-orchestra:ro \
  -e XO_SUPPORT_BUNDLE_PASSPHRASE='passphrase of the bundle' \
  -v ./xo-support-bundle.ndjson.gz.pgp:/bundle.pgp:ro \
  virtual-support-twin /bundle.pgp
```

Then open http://localhost:8080 and sign in with `admin@admin.net` / `admin`. The container is stopped with Ctrl+C, nothing persists. Credentials are not encrypted in the database of this XO.

The configuration is imported with the `xo.importConfig` JSON-RPC method, the tasks are written in the database with the modules of xo-server. Each pool is served by a read-only fake XAPI inside the container. To avoid acting on the original infrastructure:

- imported backup repositories and schedules are disabled, proxies and plugin configurations are not imported
- the XO never learns the addresses of the original hosts
- the fake XAPIs reject every call which is not a read (`MESSAGE_METHOD_UNKNOWN`)

`load-cli.mjs` can also be used on its own, on an empty XO, see `load-cli.mjs --help`: it refuses an XO with servers or tasks, and never deletes anything.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
