# XO 6 Kubernetes UI plugin

Kubernetes views of Xen Orchestra 6 (clusters, nodes, treeview), built and delivered separately from XO 6.

XO 6 (`@xen-orchestra/web`) loads it at runtime as a [Module Federation](https://module-federation.io/) remote: this package builds a `remoteEntry.js` exposing `./plugin` (see `src/plugin.ts`), which provides:

- the routes (`src/pages`, file-based routing as in XO 6)
- the translations (`src/locales`, merged into XO 6 translations)
- the treeview branch, its node components and the active node resolution

## How it works

XO 6 is the host. It shares as singletons, so that the plugin uses the very same instances (Vue app, router, stores, i18n, injection keys…):

- `vue`, `vue-router`, `pinia`, `vue-i18n` and `@regle/core`
- every `@xen-orchestra/web-core` module (imported with `@core/…`, as in XO 6)
- the XO 6 SDK (`@xen-orchestra/web/ui-plugin-sdk`, see `@xen-orchestra/web/src/modules/ui-plugin/sdk.ts`): collections, components and helpers of XO 6 that plugins may use

The shared configuration of both sides lives in `@xen-orchestra/web/federation.config.ts`.

Rules for the plugin code:

- import XO 6 only through `@xen-orchestra/web/ui-plugin-sdk`: other XO 6 modules are not available at runtime (the build fails if `@/` points outside of this package)
- `@/` refers to this package
- other libraries are bundled in the plugin: only use stateless ones, or share them in `federation.config.ts`

The contract between XO 6 and its plugins is versioned with `UI_PLUGIN_API_VERSION` (`@xen-orchestra/web/src/modules/ui-plugin/types/ui-plugin.type.ts`). XO 6 refuses a plugin built for another version, and starts without a plugin that cannot be loaded.

## Development

1. Start the plugin: `yarn dev` (rebuilds on change and serves it on http://localhost:4174)
2. In `@xen-orchestra/web/.env`, declare it: `VITE_XO_UI_PLUGINS=xo_kubernetes=http://localhost:4174/remoteEntry.js`
3. Start XO 6 as usual: `yarn dev` in `@xen-orchestra/web`

There is no hot module replacement across the federation boundary: reload XO 6 after a change of the plugin.

Unit tests (`yarn test`) run without federation: XO 6 modules used by the SDK and the XO 6 test helpers (`@xen-orchestra/web/src/test/…`) are imported directly.

## Delivery

`yarn build` produces `dist/`, to be served by any HTTP server reachable by the browser.

### Container

The `Dockerfile` builds the plugin and serves it with nginx (unprivileged, port 8080, `/healthz` for probes). It is built from the repository root, since the plugin depends on the monorepo:

```sh
docker build -f @xen-orchestra/web-kubernetes/Dockerfile -t xo-web-kubernetes .
docker run --rm -p 8080:8080 xo-web-kubernetes
```

The plugin is loaded cross-origin by the browser: nginx allows any origin (the files are public code) and makes `remoteEntry.js` always revalidated, the content-hashed `assets/` being cached for a year.

`deploy/kubernetes.yaml` is a minimal deployment (Deployment + NodePort Service, read-only root filesystem): `kubectl apply -n <namespace> -f deploy/kubernetes.yaml`, after replacing the image with the one pushed to your registry. The plugin is then served on port 30081 of the nodes: `http://<node IP>:30081/remoteEntry.js`.

Without a registry, `deploy/hack/build-and-load-image.sh [image] user@ip` builds the image, loads it on every node of the current Kubernetes context over SSH, deploys the manifest and prints the `VITE_XO_UI_PLUGINS` value for XO 6.

For now, XO 6 gets the plugins to load at build time from `VITE_XO_UI_PLUGINS`. Discovering them at runtime from xo-server is the next step.
